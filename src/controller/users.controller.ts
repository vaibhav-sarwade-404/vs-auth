import { NextFunction, Request, Response } from "express";

import authorizationcodeService from "../service/authorizationcode.service";
import loginRateLimitService from "../service/loginRateLimit.service";
import passwordService from "../service/password.service";
import refreshTokenService from "../service/refreshToken.service";
import stateService from "../service/state.service";
import usersService from "../service/users.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";
import {
  ChangePasswordRequest,
  CreateUserRequest,
  ForgotPasswordRequest,
  LoginRequest,
  SignupRequest,
  UpdateUserRequest,
  UserRUDWithPathParam
} from "../types/Request";
import { StateDocument } from "../types/StateModel";
import constants from "../utils/constants";
import { Logger } from "../utils/logger";
import clientsService from "../service/clients.service";
import emailService from "../service/email.service";
import HttpException from "../model/HttpException";
import AuthorizationError from "../model/AuthorizationError.model";
import urlUtils from "../utils/urlUtils";
import RequestValidationError from "../model/RequestValidationError.Model";

const fileName = `users.controller`;

const signup = async (req: Request, resp: Response) => {
  const funcName = signup.name;
  const logger = new Logger(`${fileName}.${funcName}`);
  try {
    const {
      email = "",
      password = "",
      user_metadata = {},
      clientId
    }: SignupRequest = req.body || {};
    const user = await usersService.findUserByEmail(email);
    if (user) {
      logger.error(`${funcName}: user already exist with email id( ${email} )`);
      return resp.status(400).json({
        validations: [{ fieldName: "email", fieldError: "user already exist" }]
      });
    }
    const _user = await usersService.createUserDocument({
      email,
      email_verified: false,
      password,
      user_metadata,
      passwordHistory: [""]
    });
    if (_user) {
      let { logDocument, clientDocument } = req;
      if (logDocument) {
        logDocument.type = "success_verification_email_sent";
        logDocument.decription = "Verification email sent successfully";
      }
      if (!clientDocument) {
        clientDocument = await clientsService.getClientByClientId(clientId, {
          exclude: ["clientSecret"]
        });
      }
      await emailService.sendUserEmail(
        "VERIFY_EMAIL",
        _user,
        clientDocument,
        logDocument
      );
      return resp.status(200).json(_user);
    }
    return resp.status(400).json({ error: "something went wrong" });
  } catch (error) {
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

const login = async (req: Request, resp: Response) => {
  const funcName = login.name;
  const logger = new Logger(`${fileName}.${funcName}`);
  const {
    email = "",
    password = "",
    callbackURL,
    clientId,
    state
  }: LoginRequest = req.body || {};
  const { scope = "" }: QueryParams = req.query || {};
  const referrerSearchParams = new URL(req.headers.referer || "").searchParams;
  const codeChallenge = referrerSearchParams.get("code_challenge") || "";
  const codeChallengeMethod =
    referrerSearchParams.get("code_challenge_method") || "";
  const audience = referrerSearchParams.get("audience") || "";
  try {
    const clientIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const user = await usersService.findUserByEmail(email);
    if (!user) {
      logger.info(
        `${funcName}: login for user with email( ${email} ) was not successful, user not found.`
      );
      return resp.status(401).json({
        error: "Username or password is wrong"
      });
    }

    if (user.blocked_for?.includes(clientIp.toString())) {
      return resp.status(429).json({
        code: "too_many_attempts",
        description:
          "Your account has been blocked after multiple consecutive login attempts",
        name: "AnomalyDetected",
        status: 429
      });
    }

    const isValidPassword = await passwordService.comparePassword(
      password,
      user.password
    );
    if (isValidPassword) {
      let formattedCallbackURL = new URL(
        referrerSearchParams.get("redirect_uri") || callbackURL
      );
      let decryptedState: string = "",
        stateDocument: StateDocument;

      if (!req.stateDocument?.state) {
        stateDocument = await stateService.findStateByEncryptedStateId({
          id: state,
          clientId
        });
        if (stateDocument) {
          decryptedState = stateDocument.state;
        }
      } else {
        decryptedState = stateService.decryptState(req.stateDocument.state);
      }
      const { user: sessionUser } = req.session;
      req.session.regenerate(err => {
        if (err) {
          throw new Error(`While generating session error: ${err}`);
        }
        req.session.user = {
          ...sessionUser,
          userId: user._id?.toString() || "",
          isAuthenticated: true
        };
        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(async error => {
          if (error) {
            throw new Error(`While generating session error: ${error}`);
          }
          const authorizationCodeDocument =
            await authorizationcodeService.createAuthourizationCodeDocument({
              userId: user._id?.toString() || "",
              clientId,
              codeChallenge,
              codeChallengeMethod,
              callbackURL,
              scope,
              audience,
              sessionId: req.session.id
            });
          formattedCallbackURL.searchParams.set(
            "code",
            authorizationCodeDocument.code || ""
          );
          formattedCallbackURL.searchParams.set("state", decryptedState);
          logger.info(
            `${funcName}: login for user with email( ${email} ) was successful, returning user to callback`
          );
          if (stateDocument && stateDocument._id) {
            stateService.deleteStateDocumentById(stateDocument._id);
          }
          usersService.incrementLoginCountByUserId(user._id || "");
          return resp.status(200).json({
            redirect_uri: formattedCallbackURL.href
          });
        });
      });
    } else {
      const rateLimitResponseDocument = await loginRateLimitService.consume(
        `${constants.RATE_LIMIT_KEYS.failedEmailPasswordLogin}${
          user.email
        }_${clientIp.toString()}`,
        1
      );
      if (rateLimitResponseDocument.isRateLimitReached) {
        logger.info(
          `${funcName}: login for user with email( ${email} ) was not successful and rate limit is reached, returning status 429 and send blocked account email`
        );
        const logDocument = req.logDocument;
        if (logDocument) {
          logDocument.type = "success_blocked_account_email_sent";
          logDocument.decription = `Users accounts is blocked for ip(${clientIp.toString()})`;
        }
        if (!req.clientDocument) {
          req.clientDocument = await clientsService.getClientByClientId(
            clientId,
            {
              exclude: ["clientSecret"]
            }
          );
        }

        usersService.blockIpForUserById(
          {
            _id: user._id || "",
            ip: clientIp.toString()
          },
          req.clientDocument,
          logDocument
        );

        return resp.status(429).json({
          code: "too_many_attempts",
          description:
            "Your account has been blocked after multiple consecutive login attempts",
          name: "AnomalyDetected",
          status: 429
        });
      }
      logger.info(
        `${funcName}: login for user with email( ${email} ) was not successful, returning user to error`
      );
      return resp.status(401).json({
        code: "failed_login",
        description: "Username or password is wrong",
        name: "FailedLogin",
        state: 400
      });
    }
  } catch (error) {
    logger.error(
      `${funcName}: Login failed for user with email( ${email} ) with error ${error}`
    );
    return resp.status(400).json({
      code: "server_error",
      description: "Something went wrong",
      name: "ServerError",
      state: 400
    });
  }
};

const logout = async (req: Request, resp: Response) => {
  const funcName = logout.name;
  const logger = new Logger(`${fileName}.${funcName}`);
  const { client_id = "", redirect_uri = "" }: QueryParams = req.query || {};
  try {
    logger.debug(
      `${funcName}: request is valid, proceeding with destroying session and deleting any refresh token registered for client `
    );
    const sessionId = req.session.id;
    req.session.destroy(err => {
      if (err) {
        return resp
          .status(302)
          .redirect(
            `/error/?client_id=${client_id}&error=request_error&error_description=${encodeURIComponent(
              "couldn't logout due to technical issue"
            )}`
          );
      }
      logger.debug(
        `${funcName}: session is destroyed, deleting all refresh tokens associated with session`
      );
      sessionId &&
        refreshTokenService.deleteRefreshTokensDocumentBySessionId(sessionId);
      return resp.status(302).redirect(redirect_uri);
    });
  } catch (error) {
    logger.error(
      `${funcName}: Logout failed for client id(${client_id}) with error ${error}`
    );
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

const forgotPassword = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const funcName = forgotPassword.name;
  const logger = new Logger(`${fileName}.${funcName}`);
  try {
    const { email }: ForgotPasswordRequest = req.body;
    await usersService.forgotPassword(
      email,
      req.clientDocument,
      req.logDocument
    );
    resp
      .status(200)
      .send("We've just sent you an email to reset your password.");
  } catch (error) {
    logger.error(
      `Something went wrong while sending forgot password with error: ${error}`
    );
    return next(
      new HttpException(500, "generic_error", "Something went wrong")
    );
  }
};

const changePassword = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const funcName = changePassword.name;
  const logger = new Logger(`${fileName}.${funcName}`);
  try {
    const { newPassword, ticket }: ChangePasswordRequest = req.body;
    const { ticketDocument, logDocument } = req;
    if (!ticketDocument || !logDocument) {
      return next(new HttpException(400, "generic_error", "validation error"));
    }
    const redirect_uri = await usersService.changePassword(
      newPassword,
      ticket,
      ticketDocument,
      logDocument
    );
    resp.status(200).json({ redirect_uri });
  } catch (error) {
    logger.error(`Something went wrong while change with error: ${error}`);
    return next(new HttpException(400, "generic_error", "validation error"));
  }
};

const emailAction = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${emailAction.name}`);
  try {
    if (req.ticketDocument && req.emailDocument) {
      if (req.emailDocument.email === "PASSWORD_RESET_EMAIL") {
        return changePassword(req, resp, next);
      }
      const result = await usersService.processActionForEmail(
        req.ticketDocument,
        req.emailDocument
      );
      if (result === "#") {
        const validationError = new AuthorizationError();
        validationError.error = `invalid_request`;
        validationError.errorDescription = `Something went wrong`;
        return next(validationError);
      }
      return resp.status(302).redirect(result);
    }
  } catch (error) {
    logger.error(
      `Something went wrong while processing email request (${req.emailDocument?.email}) with error: ${error}`
    );
    const redirect_url =
      urlUtils.createUrlWithHash(
        req.emailDocument?.redirectTo || `${process.env.HOST}error`,
        {
          success: false,
          description: `Something went wrong`
        }
      ) || "#";
    const validationError = new AuthorizationError();
    validationError.redirectUrl = redirect_url;
    next(validationError);
  }
};

const getUser = async (req: Request, resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${getUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const user = await usersService.getUser(userId);
    if (!user) {
      const validationError = new RequestValidationError();
      validationError.addError = {
        field: "userId",
        error: `userId is invalid`
      };
      return next(validationError);
    }
    return resp.status(200).send(user);
  } catch (error) {
    logger.error(
      `Something went wrong while getting user(${userId}) with error: ${error}`
    );
    next(error);
  }
};

const updateUser = async (req: Request, resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${updateUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const {
      email,
      email_verified,
      password,
      user_metadata
    }: UpdateUserRequest = req.body;
    const user = await usersService.updateUserByUserId({
      _id: userId,
      email,
      email_verified,
      password,
      user_metadata
    });
    if (!user) {
      const validationError = new RequestValidationError();
      validationError.addError = {
        field: "userId",
        error: `userId is invalid`
      };
      return next(validationError);
    }
    return resp.status(200).send(user);
  } catch (error) {
    logger.error(
      `Something went wrong while getting user(${userId}) with error: ${error}`
    );
    next(error);
  }
};

const deletUser = async (req: Request, resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${deletUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const user = await usersService.deleteUser(userId);
    if (!user) {
      const validationError = new RequestValidationError();
      validationError.addError = {
        field: "userId",
        error: `userId is invalid`
      };
      return next(validationError);
    }
    return resp.status(200).send();
  } catch (error) {
    logger.error(
      `Something went wrong while getting user(${userId}) with error: ${error}`
    );
    next(error);
  }
};

const createUser = async (req: Request, resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${deletUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const {
      email = "",
      email_verified = false,
      password = "",
      user_metadata = {}
    }: CreateUserRequest = req.body || {};
    const user = await usersService.createUserDocument({
      email,
      email_verified,
      password,
      user_metadata,
      passwordHistory: [""]
    });
    if (!user) {
      next(new HttpException());
    }
    if (!user.email_verified) {
      let { logDocument } = req;
      if (logDocument) {
        logDocument.type = "success_verification_email_sent";
        logDocument.decription = "Verification email sent successfully";
      }
      await emailService.sendUserEmail(
        "VERIFY_EMAIL",
        user,
        {
          clientId: "default_clientId",
          clientSecret: "",
          applicationType: "m2m",
          allowedCallbackUrls: [],
          allowedLogoutUrls: [],
          idTokenExpiry: 0,
          refreshTokenRotation: false,
          refreshTokenExpiry: 0,
          grantTypes: [],
          clientName: "default_client",
          api: {
            apiId: "",
            scopes: []
          }
        },
        logDocument
      );
    }
    return resp.status(200).json(user);
  } catch (error) {
    logger.error(
      `Something went wrong while getting user(${userId}) with error: ${error}`
    );
    next(error);
  }
};

export default {
  signup,
  login,
  logout,
  forgotPassword,
  changePassword,
  emailAction,
  getUser,
  updateUser,
  deletUser,
  createUser
};
