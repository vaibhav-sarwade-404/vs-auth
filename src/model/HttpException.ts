class HttpException extends Error {
  public status: number;
  public errorCode: string;
  public message: string;

  constructor(status?: number, errorCode?: string, message?: string) {
    super(message);
    this.status = status || 500;
    this.errorCode = errorCode || "generic_error";
    this.message = message || "Something went wrong";
  }
}

class UnauthorizedError extends HttpException {
  constructor(message: string) {
    super(403, "unauthorize", message);
    this.status = 403;
    this.message = message;
  }
}

export default HttpException;
export { UnauthorizedError };
