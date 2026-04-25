const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

interface ApiGetOptions {
  allowedStatuses?: number[];
}

interface ApiResult<TData> {
  data: TData;
  ok: true;
}

interface ApiEmptyResult {
  ok: false;
  status: number;
}

export async function apiGet<TData>(
  path: string,
  options: ApiGetOptions = {},
): Promise<ApiResult<TData> | ApiEmptyResult> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (options.allowedStatuses?.includes(response.status)) {
      return { ok: false, status: response.status };
    }

    throw new Error(`Request failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return { ok: false, status: response.status };
  }

  return {
    ok: true,
    data: (await response.json()) as TData,
  };
}
