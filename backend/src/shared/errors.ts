export type HttpErrorOptions = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
};

export class HttpError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(options: HttpErrorOptions) {
    super(options.message);
    this.name = "HttpError";
    this.code = options.code;
    this.statusCode = options.statusCode;

    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}
