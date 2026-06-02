export class YtDlpError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "FAILED" | "INVALID_RESPONSE"
  ) {
    super(message);
    this.name = "YtDlpError";
  }
}
