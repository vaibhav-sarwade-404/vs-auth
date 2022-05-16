interface IFieldValidationError {
  field: string;
  error: string;
}

class RequestValidationError extends Error {
  private violations: IFieldValidationError[];

  constructor() {
    super("");
    this.violations = [] as IFieldValidationError[];
  }

  get error(): IFieldValidationError[] {
    return this.violations;
  }

  set addError(error: IFieldValidationError) {
    this.violations.push(error);
  }
}

export default RequestValidationError;
