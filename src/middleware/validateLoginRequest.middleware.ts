import { Request, Response, NextFunction } from "express";

import log from "../utils/logger";
import RequestValidationError from "../model/RequestValidationError.Model";
import stateService from "../service/state.service";
import { SignupRequest } from "../types/Request";

const validateLoginRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = validateLoginRequest.name;
  log.debug(
    `${funcName}: Validating /users/login request with payload params : ${JSON.stringify(
      {
        ...req.body,
        password: "*********"
      }
    )}`
  );
  const {
    clientId = "",
    state = "",
    email = ""
  }: SignupRequest = req.body || {};
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
        `${funcName}: /users/login request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return res.status(400).send(validationError.error);
    }

    const isValidState = await stateService.isValidState({
      id: state,
      clientId
    });
    if (!isValidState) {
      validationError.addError = {
        field: "state",
        error: "Invalid state"
      };
      log.error(
        `${funcName}: /users/login request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return res.status(400).send(validationError.error);
    }
    return next();
  } catch (error) {
    log.error(
      `${funcName}: Failed to validated /users/login request with error ${error}`
    );
    return res.status(500).send({ error: `something went wrong` });
  }
};

export default validateLoginRequest;
