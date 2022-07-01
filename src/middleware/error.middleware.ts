import { NextFunction, Request, Response } from "express";

import HttpException, { UnauthorizedError } from "../model/HttpException";
import { Logger } from "../utils/logger";
import RequestValidationError from "../model/RequestValidationError.Model";
import AuthorizationError, {
  IQueryParam
} from "../model/AuthorizationError.model";
import { SchemaValidationError } from "../utils/SchemaValidator";

type ErrorType =
  | HttpException
  | UnauthorizedError
  | RequestValidationError
  | AuthorizationError
  | Error;

const errorHandlerMiddlerware = (
  error: ErrorType,
  _req: Request,
  resp: Response,
  _next: NextFunction
): Response | void => {
  const logger = new Logger(errorHandlerMiddlerware.name);
  if (error instanceof HttpException || error instanceof UnauthorizedError) {
    const status = error.status;
    const errorCode = error.errorCode;
    const message = error.message;
    return resp
      .status(status)
      .json({ error: errorCode, errorDescription: message });
  }

  if (error instanceof RequestValidationError) {
    logger.error(`Validation errors: ${JSON.stringify(error.error)}`);
    return resp.status(400).json(error.error);
  }
  if (error instanceof SchemaValidationError) {
    logger.error(
      `Schema validation errors: ${JSON.stringify(error.getErrors())}`
    );
    return resp.status(400).json(error.getErrors());
  }

  if (error instanceof AuthorizationError) {
    if (error.redirectUrl) return resp.status(302).redirect(error.redirectUrl);
    let search = `?`;
    const { error: _error, errorDescription, queryParam } = error;
    queryParam.forEach((_queryParam: IQueryParam, index: number) => {
      search += `${index !== error.queryParam.length - 1 ? "&" : ""}${
        _queryParam.field
      }=${_queryParam.value}`;
    });
    return resp
      .status(302)
      .redirect(
        `/error/?${search}&error=${_error}&errorDescription=${errorDescription}`
      );
  }

  logger.error(`Something went wrong with error: ${error}`);
  return resp
    .status(500)
    .json({ error: "generic_error", errorDescription: "Something went wrong" });
};

export default errorHandlerMiddlerware;
