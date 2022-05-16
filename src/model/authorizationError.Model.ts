interface IAuthorizationError {
  error?: string;
  errorDescription?: string;
}

class AuthorizationError extends Error {
  private _error: string = "invalid_request";
  private _errorDescription: string = "";

  constructor(params?: IAuthorizationError) {
    super(`${params?.error} ${params?.errorDescription}`);
    this._error = params?.error || "";
    this._errorDescription = params?.errorDescription || "";
  }

  set error(_error: string) {
    this._error = _error;
  }

  set errorDescription(_errorDescription: string) {
    this._errorDescription = _errorDescription;
  }

  get error(): string {
    return this._error;
  }
  get errorDescription(): string {
    return this._errorDescription;
  }

  get errorAsObject(): IAuthorizationError {
    return {
      error: this._error,
      errorDescription: this._errorDescription
    };
  }
}

export default AuthorizationError;
