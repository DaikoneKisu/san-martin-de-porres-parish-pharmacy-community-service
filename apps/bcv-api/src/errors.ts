import type { Response } from "express";

export enum ErrorCodes {
  FINGERPRINT_UNAUTHORIZED_ERROR = "fingerprint-unauthorized-error",
  BCV_FETCH_ERROR = "bcv-fetch-error",
  BCV_PARSE_ERROR = "bcv-parse-error",
  UNKNOWN_ERROR = "unknown-error"
}

export class ApiError extends Error {
  code: ErrorCodes;
  cause?: unknown;

  constructor(message: string, code: ErrorCodes, cause?: unknown) {
    super(message);
    this.code = code;
    this.cause = cause;
  }
}

export function sendHttpErrorResponse(error: unknown, target: string, res: Response) {
  const formatError = (error: ApiError, target: string) => ({
    code: error.code,
    message: error.message,
    target
  })

  if (!(error instanceof ApiError)) {
    console.error(`Unexpected error on ${target}:`, error);
    res.status(500).json(formatError(new ApiError("Unknown error occurred while processing request.", ErrorCodes.UNKNOWN_ERROR, error), target));
    return;
  }

  console.error(`API error on ${target}:`, error);

  switch (error.code) {
    case ErrorCodes.UNKNOWN_ERROR:
      res.status(500).json(formatError(error, target));
      return;
    case ErrorCodes.BCV_PARSE_ERROR:
      res.status(503).json(formatError(error, target));
      return;
    case ErrorCodes.BCV_FETCH_ERROR:
      res.status(502).json(formatError(error, target));
      return;
    case ErrorCodes.FINGERPRINT_UNAUTHORIZED_ERROR:
      res.status(502).json(formatError(error, target));
      return;
    default:
      console.error(`Unhandled error code: ${error.code}`);
      res.status(500).json(formatError(new ApiError("Unknown error occurred while processing request.", ErrorCodes.UNKNOWN_ERROR, error), target));
      return;
  }
}