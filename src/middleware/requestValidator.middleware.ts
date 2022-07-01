import { Request, Response, NextFunction } from "express";

import authorizeRequestService from "../service/clients.service";
import tokenService from "../service/token.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";
import { Logger } from "../utils/logger";
import AuthorizationError from "../model/AuthorizationError.model";
import constants from "../utils/constants";
import stateService from "../service/state.service";
import logService from "../service/log.service";
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  SignupRequest,
  TicketRequestParams
} from "../types/Request";
import RequestValidationError from "../model/RequestValidationError.Model";
import apiService from "../service/api.service";
import ticketService from "../service/ticket.service";
import emailService from "../service/email.service";
import urlUtils from "../utils/urlUtils";
import HttpException, { UnauthorizedError } from "../model/HttpException";
import { EMAIL_TYPES } from "../types/EmailModel";

const fileName = "requestValidator.middleware";

const authorizeRedirectRequest = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${authorizeRedirectRequest.name}`);
  logger.debug(
    `Validating /authorize request with query params : ${JSON.stringify(
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
          logger.debug(`Found client for client id: ${client_id}`);
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
      logger.error(
        `/authorize request has some voilations : ${JSON.stringify(
          validationError.errorAsObject
        )} `
      );
      validationError.addQueryParam = { field: "client_id", value: client_id };
      validationError.addQueryParam = { field: "state", value: state };
      return next(validationError);
    }
    req.session.user = {
      ...req.session.user,
      authorizeValidated: true
    };
    return next();
  } catch (error) {
    logger.error(`Failed to validated /authorize request with error ${error}`);
    const validationError = new AuthorizationError();
    validationError.addQueryParam = { field: "client_id", value: client_id };
    validationError.addQueryParam = { field: "state", value: state };
    return next(validationError);
  }
};

const loginRedirectRequest = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${loginRedirectRequest.name}`);
  logger.debug(
    `Validating /login request with query params : ${JSON.stringify(req.query)}`
  );
  const { client_id = "", state = "" }: QueryParams = req.query || {};
  try {
    const validationError = new AuthorizationError();
    if (!req.session.user || !req.session.user.authorizeValidated) {
      validationError.addQueryParam = { field: "client_id", value: client_id };
      validationError.addQueryParam = { field: "state", value: state };
      validationError.errorDescription = constants.ERROR_STRINGS.invalidRequest;
      return next(validationError);
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
        req.logDocument.type = "unauthorized";
        req.logDocument.decription = validationError.errorDescription;
        logService.createLogEvent(req.logDocument);
      }
      logger.error(
        `/login request has some voilations : ${JSON.stringify(
          validationError.errorAsObject
        )} `
      );
      validationError.addQueryParam = { field: "client_id", value: client_id };
      validationError.addQueryParam = { field: "state", value: state };
      return next(validationError);
    }
    return next();
  } catch (error) {
    logger.error(`Failed to validated /login request with error ${error}`);
    const validationError = new AuthorizationError();
    validationError.addQueryParam = { field: "client_id", value: client_id };
    validationError.addQueryParam = { field: "state", value: state };
    validationError.error = "anomaly_detected";
    validationError.errorDescription = "unauthorized";
    return next(validationError);
  }
};

const signupRequest = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${signupRequest.name}`);
  logger.debug(
    `Validating /users/signup request with payload params : ${JSON.stringify({
      ...req.body,
      password: "*********"
    })}`
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
      logger.error(
        `/users/signup request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return next(validationError);
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
      logger.error(
        `/users/signup request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return next(validationError);
    }
    req.stateDocument = stateDocument;
    return next();
  } catch (error) {
    logger.error(
      `Failed to validated /users/signup request with error ${error}`
    );
    return next(new HttpException());
  }
};

const loginRequest = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${loginRequest.name}`);
  logger.debug(
    `Validating /users/login request with payload params : ${JSON.stringify({
      ...req.body,
      password: "*********"
    })}`
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
      logger.error(
        `/users/login request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return next(validationError);
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
      logger.error(
        `/users/login request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return next(validationError);
    }
    return next();
  } catch (error) {
    logger.error(
      `Failed to validated /users/login request with error ${error}`
    );
    return next(new HttpException());
  }
};

const userInfoRequest = (req: Request, _resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${userInfoRequest.name}`);
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
      return next(new UnauthorizedError("Invalid or expired access token"));
    }
    req.session.user = {};
    req.session.user.userId = tokenPayload.sub || "";
    req.session.user.isAuthenticated = true;
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating access token to fetch userinfo with error: ${error}`
    );
    return next(new UnauthorizedError("Invalid access token"));
  }
};

const logoutRequest = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${logoutRequest.name}`);
  const {
    client_id: clientId = "",
    redirect_uri: redirectUri = ""
  }: QueryParams = req.query;
  try {
    const validationError = new AuthorizationError();
    if (!clientId) {
      validationError.addQueryParam = {
        field: "error_description",
        value: "missing required parameter client_id"
      };
      return next(validationError);
    }
    if (!redirectUri) {
      validationError.addQueryParam = {
        field: "error_description",
        value: "missing required parameter redirect_uri"
      };
      return next(validationError);
    }
    const client = await authorizeRequestService.getClientByClientId(clientId, {
      exclude: ["clientSecret"]
    });
    if (!client) {
      validationError.addQueryParam = {
        field: "error_description",
        value: "invalid parameter redirect_uri"
      };
      return next(validationError);
    }
    logger.debug(`Found client for client id: ${clientId}`);
    if (!(client.allowedLogoutUrls || []).includes(redirectUri)) {
      logger.debug(
        `redirectUri ${redirectUri} is not registered for client: ${clientId}`
      );
      validationError.addQueryParam = {
        field: "error_description",
        value: "invalid parameter redirect_uri"
      };
      return next(validationError);
    }
    logger.debug(
      `logout payload validtion successful for clientId (${clientId})`
    );
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating logout request parameters with error: ${error}`
    );
    return next(new AuthorizationError());
  }
};

const forgotPasswordRequest = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${forgotPasswordRequest.name}`);
  try {
    const validationError = new RequestValidationError();
    ["client_id", "email"].forEach(field => {
      if (!(req.body || {})[field]) {
        validationError.addError = {
          field,
          error: `${field} is required`
        };
      }
    });
    if (validationError.error.length) {
      logger.error(
        `/users/forgot-password request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return next(validationError);
    }
    const { client_id: clientId = "" }: ForgotPasswordRequest = req.body || {};
    const client = await authorizeRequestService.getClientByClientId(clientId, {
      exclude: ["clientSecret"]
    });
    if (!client) {
      validationError.addError = {
        field: "client_id",
        error: "client_id is invalid"
      };
      return next(validationError);
    }
    req.clientDocument = client;
    logger.debug(`Found client for client id: ${clientId}`);
    logger.debug(
      `forgot password payload validtion successful for clientId (${clientId})`
    );
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating forgot password request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const passwordReset = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${passwordReset.name}`);
  try {
    const validationError = new RequestValidationError();
    ["newPassword", "ticket", "_csrf"].forEach(field => {
      if (!(req.body || {})[field]) {
        validationError.addError = {
          field,
          error: `${field} is required`
        };
      }
    });
    if (validationError.error.length) {
      logger.error(
        `/users/password-reset request has some voilations : ${JSON.stringify(
          validationError.error
        )} `
      );
      return next(validationError);
    }
    const { ticket }: ChangePasswordRequest = req.body || {};
    const ticketDocument = await ticketService.findTicketById(ticket);
    if (!ticketDocument) {
      logger.error(`Ticket is expired or invalid`);
      const emailDocument = await emailService.getEmailDocument(
        "PASSWORD_RESET_EMAIL"
      );
      const url = urlUtils.createUrlWithHash(emailDocument.redirectTo, {
        success: false,
        decription: "This link is already used, or expired"
      });
      logger.error(`returning user redirect URL to used or expired page`);
      return resp.status(200).json({ redirect_url: url });
    }
    if (ticketDocument.expires < new Date()) {
      logger.error(
        `ticket is expired, return retunrnTo url from email configurations`
      );
      const emailDocument = await emailService.getEmailDocument(
        ticketDocument.ticketContext.type
      );
      if (!emailDocument) {
        logger.error(
          `Email document is also not found, returning invalid ticket error`
        );
        validationError.addError = {
          field: "ticket",
          error: "ticket is invalid"
        };
        return next(validationError);
      }
      const url = urlUtils.createUrlWithHash(emailDocument.redirectTo, {
        success: false,
        decription: "This link is expired"
      });
      return resp.status(200).json({ redirect_url: url });
    }
    req.ticketDocument = ticketDocument;
    logger.debug(`Found ticket document for password reset request`);
    logger.debug(
      `password reset payload validtion successful for ticket(${ticket})`
    );
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating password reset request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const emailAction = async (
  req: Request,
  _resp: Response,
  next: NextFunction,
  emailType: EMAIL_TYPES
) => {
  const logger = new Logger(`${fileName}.${emailAction.name}`);
  try {
    const { ticket = "" }: TicketRequestParams = req.query || {};
    if (!ticket) {
      const validationError = new RequestValidationError();
      validationError.addError = {
        field: "ticket",
        error: "ticket is required"
      };
      return next(validationError);
    }
    const emailDocument = await emailService.getEmailDocument(emailType);
    const ticketDocument = await ticketService.findTicketById(ticket);
    if (!ticketDocument) {
      const url = urlUtils.createUrlWithHash(emailDocument.redirectTo, {
        success: false,
        decription: "This link is already used, or expired"
      });
      const validationError = new AuthorizationError();
      validationError.redirectUrl = url || "#";
      return next(validationError);
    }
    req.ticketDocument = ticketDocument;
    req.emailDocument = emailDocument;
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating email action request with error: ${error}`
    );
    return next(new HttpException());
  }
};

export default {
  userInfoRequest,
  logoutRequest,
  authorizeRedirectRequest,
  loginRedirectRequest,
  signupRequest,
  loginRequest,
  forgotPasswordRequest,
  passwordReset,
  emailAction
};
