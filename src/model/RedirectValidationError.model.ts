class RedirectValidationError {
  private _errMsg = "";

  constructor(errMsg: string) {
    this._errMsg = errMsg || "";
  }

  get errMsg(): string {
    return this._errMsg;
  }
}

export default RedirectValidationError;
