import { NextFunction, Request, Response } from "express";

import HttpException from "../model/HttpException";
import RequestValidationError from "../model/RequestValidationError.Model";
import {
  PagesHtmlUpdatePathParam,
  PagesHtmlUpdateRequest
} from "../types/Request";
import constants from "../utils/constants";
import { Logger } from "../utils/logger";
import {
  SchemaValidationError,
  SchemaValidator
} from "../utils/SchemaValidator";

const fileName = "pagesMARequestValidator.middleware";

const updatePage = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${updatePage.name}`);
  const { page: pagePathParam }: PagesHtmlUpdatePathParam = req.params;
  try {
    const schemaValidatorInstance = SchemaValidator.getInstance({});
    const { page }: PagesHtmlUpdateRequest = req.body;
    const schemValidationErrors = schemaValidatorInstance.validate(
      constants.validationSchemaNames.updatePage,
      req.body
    );
    if (
      schemValidationErrors instanceof SchemaValidationError &&
      schemValidationErrors.hasSchemaValidationError()
    ) {
      return next(schemValidationErrors);
    }
    const validationError = new RequestValidationError();
    if (page !== pagePathParam) {
      validationError.addError = {
        field: "page",
        error: `${page} does not match from path param`
      };
      return next(validationError);
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating update page(${pagePathParam}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

export default {
  updatePage
};
