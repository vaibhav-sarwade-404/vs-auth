import { Request, Response, NextFunction } from "express";

import authorizeRequestService from "../service/clients.service";
import tokenService from "../service/token.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";
import RedirectValidationError from "../model/RedirectValidationError.model";
import log from "../utils/logger";
import AuthorizationError from "../model/AuthorizationError.model";
import constants from "../utils/constants";
import stateService from "../service/state.service";
import logService from "../service/log.service";
import { SignupRequest } from "../types/Request";
import RequestValidationError from "../model/RequestValidationError.Model";
import apiService from "../service/api.service";

const fileName = "requestValidator.middleware";

const authorizeRedirectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = `${fileName}.${authorizeRedirectRequest.name}`;
  log.debug(
    `${funcName}: Validating /authorize request with query params : ${JSON.stringify(
      req.query
    )}`
  );
  const {
    client_id = "",
    redirect_uri = "",
    response_type = "code",
    state = "",
    audience = ""
  }: QueryParams = req.query || {};
  try {
    const validationError = new AuthorizationError();

    if (!client_id) {
      validationError.errorDescription = `${constants.ERROR_STRINGS.missingRequiredParameter} client_id`;
    } else if (!redirect_uri) {
      validationError.errorDescription = `${constants.ERROR_STRINGS.missingRequiredParameter} redirect_uri`;
    } else if (!response_type) {
      validationError.errorDescription = `${constants.ERROR_STRINGS.missingRequiredParameter} response_type`;
    }

    if (!validationError.errorDescription) {
      const api = await apiService.findApiByIdentifier(audience);
      if (!api || api.type !== "custom_api") {
        validationError.errorDescription =
          constants.ERROR_STRINGS.invalidAudience;
      }
      if (!validationError.errorDescription) {
        //compare client
        const client = await authorizeRequestService.getClientByClientId(
          client_id,
          {
            exclude: ["clientSecret"]
          }
        );
        if (client) {
          log.debug(`${funcName}: Found client for client id: ${client_id}`);
          let compareGrantType =
            response_type === "code" ? "authorization_code" : response_type;
          if (!(client.grantTypes || []).includes(compareGrantType)) {
            validationError.error = "unsupported_response_type";
            validationError.errorDescription = `${constants.ERROR_STRINGS.unsupportedResponseType} ${response_type}`;
          } else if (
            !(client.allowedCallbackUrls || []).includes(redirect_uri)
          ) {
            validationError.errorDescription = `${constants.ERROR_STRINGS.callbackMismatch} ${redirect_uri}`;
          }
        } else {
          validationError.error = "invalid_request";
          validationError.errorDescription = `${constants.ERROR_STRINGS.unknownClient} ${client_id}`;
        }
      }
    }
    if (validationError.errorDescription) {
      log.error(
        `${funcName}: /authorize request has some voilations : ${JSON.stringify(
          validationError.errorAsObject
        )} `
      );
      return res
        .status(302)
        .redirect(
          `/error/?client_id=${client_id}&state=${state}&error=${validationError.error}&error_description=${validationError.errorDescription}`
        );
    }
    req.session.user = {
      ...req.session.user,
      authorizeValidated: true
    };
    return next();
  } catch (error) {
    log.error(
      `${funcName}: Failed to validated /authorize request with error ${error}`
    );
    return res
      .status(302)
      .redirect(
        `/error/?client_id=${client_id}&state=${state}&error_description=Generic error`
      );
  }
};

const loginRedirectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = `${fileName}.${loginRedirectRequest.name}`;
  log.debug(
    `${funcName}: Validating /authorize request with query params : ${JSON.stringify(
      req.query
    )}`
  );
  const { client_id = "", state = "" }: QueryParams = req.query || {};
  try {
    const validationError = new AuthorizationError();
    if (!req.session.user || !req.session.user.authorizeValidated) {
      throw new RedirectValidationError(constants.ERROR_STRINGS.invalidRequest);
    }

    const isValidState = await stateService.isValidState({
      id: state,
      clientId: client_id
    });
    if (!isValidState) {
      validationError.errorDescription = constants.ERROR_STRINGS.invalidState;
    }
    if (validationError.errorDescription) {
      if (req.logDocument) {
        req.logDocument.type = validationError.error || "unauthorized";
        req.logDocument.decription = validationError.errorDescription;
        logService.createLogEvent(req.logDocument);
      }
      log.error(
        `${funcName}: /login request has some voilations : ${JSON.stringify(
          validationError.errorAsObject
        )} `
      );
      return res
        .status(302)
        .redirect(
          `/error/?client_id=${client_id}&state=${state}&error=${validationError.error}&error_description=${validationError.errorDescription}`
        );
    }
    return next();
  } catch (error) {
    log.error(
      `${funcName}: Failed to validated /login request with error ${error}`
    );
    return res
      .status(302)
      .redirect(
        `/error/?client_id=${client_id}&state=${state}&error=anomaly_detected&error_description=unauthorized`
      );
  }
};

const signupRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = `${fileName}.${signupRequest.name}`;
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

const loginRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const funcName = `${fileName}.${loginRequest.name}`;
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

const validateUserInfoRequest = (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const funcName = `requestValidator.middlware.${validateUserInfoRequest.name}`;
  try {
    const { authorization = "" } = req.headers;
    if (!authorization) throw new Error("missing header");
    const tokenPayload = tokenService.verifyAccessToken(
      authorization.replace("Bearer ", ""),
      {
        audience: "https://users.api.vsauth.com/userinfo",
        issuer: "vs-auth",
        algorithms: ["RS256"]
      }
    );
    if (!tokenPayload || typeof tokenPayload === "string") {
      throw new Error("Invalid or expired token");
    }
    req.session.user = {};
    req.session.user.userId = tokenPayload.sub || "";
    req.session.user.isAuthenticated = true;
    return next();
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while validating access token to fetch userinfo with error: ${error}`
    );
    return resp.status(403).json({
      error: "Invalid access token"
    });
  }
};

const validateLogoutRequest = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const funcName = `requestValidator.middlware.${validateLogoutRequest.name}`;
  const {
    client_id: clientId = "",
    redirect_uri: redirectUri = ""
  }: QueryParams = req.query;
  try {
    if (!clientId)
      throw new RedirectValidationError("missing required parameter client_id");
    if (!redirectUri)
      throw new Error("missing required parameter : redirect_uri");
    const client = await authorizeRequestService.getClientByClientId(clientId, {
      exclude: ["clientSecret"]
    });
    if (!client)
      throw new RedirectValidationError("invalid parameter client_id");
    if (client) {
      log.debug(`${funcName}: Found client for client id: ${clientId}`);
      if (!(client.allowedLogoutUrls || []).includes(redirectUri)) {
        log.debug(
          `${funcName}: redirectUri ${redirectUri} is not registered for client: ${clientId}`
        );
        throw new RedirectValidationError("invalid parameter redirect_uri");
      }
    }
    log.debug(
      `${funcName}: logout payload validtion successful for clientId (${clientId})`
    );
    return next();
  } catch (error) {
    if (error instanceof RedirectValidationError) {
      log.error(
        `${funcName}: Redirect validation error while logout request validation with error:${JSON.stringify(
          error
        )}`
      );
      return resp
        .status(302)
        .redirect(
          `/error/?client_id=${clientId}&error=invalid_request&error_description=${error.errMsg}`
        );
    }
    log.error(
      `${funcName}: Something went wrong while validating logout request parameters with error: ${error}`
    );
    return resp
      .status(302)
      .redirect(
        `/error/?client_id=${clientId}&error=invalid_request&error_description=Generic error`
      );
  }
};

export default {
  validateUserInfoRequest,
  validateLogoutRequest,
  authorizeRedirectRequest,
  loginRedirectRequest,
  signupRequest,
  loginRequest
};
