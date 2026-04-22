export enum ErrorCodes {
  FINGERPRINT_UNAUTHORIZED_ERROR = "fingerprint-unauthorized-error",
  BCV_FETCH_ERROR = "bcv-fetch-error",
  BCV_PARSE_ERROR = "bcv-parse-error",
  UNKNOWN_ERROR = "unknown-error",
}

export class ApiError extends Error {
  code: ErrorCodes;
  override cause?: unknown;

  constructor(message: string, code: ErrorCodes, cause?: unknown) {
    super(message);
    this.code = code;
    this.cause = cause;
  }
}
