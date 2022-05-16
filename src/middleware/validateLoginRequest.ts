import { Request, Response, NextFunction } from "express";

import AuthorizationError from "../model/authorizationError.Model";
import authorizeService from "../service/authorize.service";
import log from "../utils/logger";
import constants from "../utils/constants";
import { QueryParams } from "../types/AuthorizeModel.types";
import stateService from "../service/state.service";

const validateLoginRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = validateLoginRequest.name;
  log.debug(
    `${funcName}: Validating /authorize request with query params : ${JSON.stringify(
      req.query
    )}`
  );
  try {
    const {
      client_id = "",
      redirect_uri = "",
      response_type = "code",
      state = ""
    }: QueryParams = req.query || {};

    const validationError = new AuthorizationError();

    if (!client_id) {
      validationError.errorDescription = `${constants.ERROR_STRINGS.missingRequiredParameter} client_id`;
    } else if (!redirect_uri) {
      validationError.errorDescription = `${constants.ERROR_STRINGS.missingRequiredParameter} redirect_uri`;
    } else if (!response_type) {
      validationError.errorDescription = `${constants.ERROR_STRINGS.missingRequiredParameter} response_type`;
    }

    //compare client
    const client = await authorizeService.getClientByClientId(client_id, {
      exclude: ["clientSecret"]
    });
    if (client) {
      log.debug(`${funcName}: Found client for client id: ${client_id}`);
      let compareGrantType =
        response_type === "code" ? "authorization_code" : response_type;
      if (!(client.grantTypes || []).includes(compareGrantType)) {
        validationError.error = "unsupported_response_type";
        validationError.errorDescription = `${constants.ERROR_STRINGS.unsupportedResponseType} ${response_type}`;
      } else if (!(client.allowedCallbackUrls || []).includes(redirect_uri)) {
        validationError.errorDescription = `${constants.ERROR_STRINGS.callbackMismatch} ${redirect_uri}`;
      } else {
        const isValidState = await stateService.isValidState({
          state: decodeURIComponent(state),
          clientId: client_id
        });
        if (!isValidState) {
          validationError.errorDescription =
            constants.ERROR_STRINGS.invalidState;
        }
      }
    } else {
      validationError.error = "invalid_request";
      validationError.errorDescription = `${constants.ERROR_STRINGS.unknownClient} ${client_id}`;
    }

    if (validationError.errorDescription) {
      log.error(
        `${funcName}: /login request has some voilations : ${JSON.stringify(
          validationError.errorAsObject
        )} `
      );
      return res
        .status(302)
        .redirect(
          `/error/?error=${validationError.error}&error_description=${validationError.errorDescription}`
        );
    }
    return next();
  } catch (error) {
    log.error(
      `${funcName}: Failed to validated /login request with error ${error}`
    );
    return res.status(500).send({ error: `something went wrong` });
  }
};

export default validateLoginRequest;
