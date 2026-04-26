const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const csrfHeaderName = "X-CSRF-Token";

interface ApiRequestOptions {
  allowedStatuses?: number[];
  body?: unknown;
  expectJson?: boolean;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  skipCsrf?: boolean;
  skipRefresh?: boolean;
}

export interface ApiResult<TData> {
  data: TData;
  ok: true;
}

export interface ApiEmptyResult {
  ok: false;
  status: number;
}

type ApiErrorOptions = {
  code?: string;
  details?: unknown;
  message: string;
  status: number;
};

type AuthChannelMessage =
  | {
      csrfToken: string;
      type: "session-refreshed";
    }
  | {
      type: "session-cleared";
    };

export class ApiError extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;

    if (options.code !== undefined) {
      this.code = options.code;
    }

    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

let csrfToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

function createAuthChannel() {
  if (typeof globalThis.BroadcastChannel !== "function") {
    return null;
  }

  const channel = new globalThis.BroadcastChannel("personal-finance-auth");

  channel.addEventListener("message", (event: MessageEvent<AuthChannelMessage>) => {
    if (event.data.type === "session-refreshed") {
      csrfToken = event.data.csrfToken;
      return;
    }

    csrfToken = null;
  });

  return channel;
}

const authChannel = createAuthChannel();

function broadcastAuthMessage(message: AuthChannelMessage) {
  authChannel?.postMessage(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorBody(body: unknown) {
  if (!isRecord(body) || !isRecord(body.error)) {
    return null;
  }

  const { code, details, message } = body.error;

  if (typeof message !== "string") {
    return null;
  }

  return {
    code: typeof code === "string" ? code : undefined,
    details,
    message,
  };
}

async function readJsonBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return undefined;
  }

  return (await response.json()) as unknown;
}

async function createApiError(response: Response) {
  const body = await readJsonBody(response);
  const errorBody = readErrorBody(body);

  if (errorBody) {
    return new ApiError({
      code: errorBody.code,
      details: errorBody.details,
      message: errorBody.message,
      status: response.status,
    });
  }

  return new ApiError({
    message: `Request failed with status ${response.status}.`,
    status: response.status,
  });
}

function isMutatingMethod(method: ApiRequestOptions["method"]) {
  return method !== "GET";
}

function clearCsrfToken(shouldBroadcast: boolean) {
  csrfToken = null;

  if (shouldBroadcast) {
    broadcastAuthMessage({ type: "session-cleared" });
  }
}

export function clearApiSession(options: { broadcast?: boolean } = {}) {
  clearCsrfToken(options.broadcast ?? true);
}

export async function fetchCsrfToken() {
  const response = await fetch(`${apiBaseUrl}/auth/csrf`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  const body = await readJsonBody(response);

  if (!isRecord(body) || typeof body.csrfToken !== "string") {
    throw new ApiError({
      message: "CSRF response did not include a token.",
      status: response.status,
    });
  }

  csrfToken = body.csrfToken;
  broadcastAuthMessage({
    csrfToken,
    type: "session-refreshed",
  });

  return csrfToken;
}

async function refreshSession() {
  refreshPromise ??= performSessionRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performSessionRefresh() {
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    method: "POST",
  });

  if (!response.ok && response.status !== 409) {
    clearCsrfToken(true);
    return false;
  }

  try {
    await fetchCsrfToken();
    return true;
  } catch {
    clearCsrfToken(true);
    return false;
  }
}

async function buildRequestHeaders(options: ApiRequestOptions) {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (isMutatingMethod(options.method) && !options.skipCsrf) {
    const token = csrfToken ?? (await fetchCsrfToken());

    headers.set(csrfHeaderName, token);
  }

  return headers;
}

async function sendApiRequest(options: ApiRequestOptions, path: string) {
  return fetch(`${apiBaseUrl}${path}`, {
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "include",
    headers: await buildRequestHeaders(options),
    method: options.method,
  });
}

async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions,
): Promise<ApiResult<TData> | ApiEmptyResult> {
  let response = await sendApiRequest(options, path);

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await refreshSession();

    if (refreshed) {
      response = await sendApiRequest(options, path);
    }
  }

  if (!response.ok) {
    if (options.allowedStatuses?.includes(response.status)) {
      return { ok: false, status: response.status };
    }

    throw await createApiError(response);
  }

  if (response.status === 204 || options.expectJson === false) {
    return {
      data: undefined as TData,
      ok: true,
    };
  }

  return {
    data: (await readJsonBody(response)) as TData,
    ok: true,
  };
}

export async function apiGet<TData>(
  path: string,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<ApiResult<TData> | ApiEmptyResult> {
  return apiRequest<TData>(path, {
    ...options,
    method: "GET",
  });
}

export async function apiPost<TData>(
  path: string,
  body?: unknown,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<ApiResult<TData> | ApiEmptyResult> {
  return apiRequest<TData>(path, {
    ...options,
    body,
    method: "POST",
  });
}

export async function apiPatch<TData>(
  path: string,
  body?: unknown,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<ApiResult<TData> | ApiEmptyResult> {
  return apiRequest<TData>(path, {
    ...options,
    body,
    method: "PATCH",
  });
}

export async function apiDelete<TData>(
  path: string,
  options: Omit<ApiRequestOptions, "body" | "method"> = {},
): Promise<ApiResult<TData> | ApiEmptyResult> {
  return apiRequest<TData>(path, {
    ...options,
    method: "DELETE",
  });
}
