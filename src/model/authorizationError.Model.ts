interface IAuthorizationError {
  error?: string;
  errorDescription?: string;
  redirectUrl?: string;
}
export interface IQueryParam {
  field: string;
  value: string;
}

class AuthorizationError extends Error {
  private _error: string = "invalid_request";
  private _errorDescription: string = "Generic error";
  private _redirectUrl: string = "";
  private queryParams: IQueryParam[];

  constructor(params?: IAuthorizationError) {
    super(`${params?.error} ${params?.errorDescription}`);
    this._error = params?.error || "";
    this._errorDescription = params?.errorDescription || "";
    this.queryParams = [] as IQueryParam[];
  }

  set error(_error: string) {
    this._error = _error;
  }

  set errorDescription(_errorDescription: string) {
    this._errorDescription = _errorDescription;
  }

  set redirectUrl(redirect_url: string) {
    this._redirectUrl = redirect_url;
  }

  set addQueryParam(queryParam: IQueryParam) {
    this.queryParams.push(queryParam);
  }

  get error(): string {
    return this._error;
  }
  get errorDescription(): string {
    return this._errorDescription;
  }

  get redirectUrl(): string {
    return this._redirectUrl;
  }

  get queryParam(): IQueryParam[] {
    return this.queryParam;
  }
  get errorAsObject(): IAuthorizationError {
    return {
      error: this._error,
      errorDescription: this._errorDescription,
      redirectUrl: this._redirectUrl
    };
  }
}

export default AuthorizationError;
