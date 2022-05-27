import { Request, Response, NextFunction } from "express";

import log from "../utils/logger";
import RequestValidationError from "../model/RequestValidationError.Model";
import stateService from "../service/state.service";
import { SignupRequest } from "../types/Request";

const validateSignupRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = validateSignupRequest.name;
  log.debug(
    `${funcName}: Validating /users/signup request with payload params : ${JSON.stringify(
      {
        ...req.body,
        password: "*********"
      }
    )}`
  );
  const { clientId = "", state = "" }: SignupRequest = req.body || {};
  try {
    const validationError = new RequestValidationError();
    ["clientId", "callbackURL", "state", "email", "password"].forEach(field => {
      if (!(req.body || {})[field]) {
        validationError.addError = {
          field,
          error: `${field} is required`
        };
      }
    });
    if (validationError.error.length) {
      log.error(
        `${funcName}: /users/signup request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return res.status(400).send(validationError.error);
    }
    const stateDocument = await stateService.findStateByEncryptedStateId({
      id: state,
      clientId
    });
    if (!stateDocument) {
      validationError.addError = {
        field: "state",
        error: "Invalid state"
      };
      log.error(
        `${funcName}: /users/signup request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return res.status(400).json(validationError.error);
    }
    req.stateDocument = stateDocument;
    return next();
  } catch (error) {
    log.error(
      `${funcName}: Failed to validated /users/signup request with error ${error}`
    );
    return res.status(500).json({ error: `something went wrong` });
  }
};

export default validateSignupRequest;
