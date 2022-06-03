import { Request, Response } from "express";
import authorizationcodeService from "../service/authorizationcode.service";
import loginRateLimitService from "../service/loginRateLimit.service";
import passwordService from "../service/password.service";
import refreshTokenService from "../service/refreshToken.service";
import stateService from "../service/state.service";

import usersService from "../service/users.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";
import { LoginRequest, SignupRequest } from "../types/Request";
import { StateDocument } from "../types/StateModel";
import constants from "../utils/constants";
import log from "../utils/logger";

const signup = async (req: Request, resp: Response) => {
  const funcName = signup.name;
  try {
    const {
      email = "",
      password = "",
      user_metadata = {}
    }: SignupRequest = req.body || {};
    const user = await usersService.findUserByEmail(email);
    if (user) {
      log.error(`${funcName}: user already exist with email id( ${email} )`);
      return resp.status(400).json({
        validations: [{ fieldName: "email", fieldError: "user already exist" }]
      });
    }
    const _user = await usersService.createUserDocument({
      email,
      password,
      user_metadata
    });
    return resp.status(200).json(_user);
  } catch (error) {
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

const login = async (req: Request, resp: Response) => {
  const funcName = login.name;
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
  try {
    const clientIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const user = await usersService.findUserByEmail(email);
    if (!user) {
      log.info(
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
        state: 429
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
      let decryptedState = "",
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
        decryptedState = stateService.decryptState(
          // decodeURIComponent(req.stateDocument.state)
          req.stateDocument.state
        );
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
              sessionId: req.session.id
            });
          formattedCallbackURL.searchParams.set(
            "code",
            authorizationCodeDocument.code || ""
          );
          formattedCallbackURL.searchParams.set("state", decryptedState);
          log.info(
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
        log.info(
          `${funcName}: login for user with email( ${email} ) was not successful, returning user to error`
        );
        usersService.blockIpForUserById({
          _id: user._id || "",
          ip: clientIp.toString()
        });
        return resp.status(429).json({
          code: "too_many_attempts",
          description:
            "Your account has been blocked after multiple consecutive login attempts",
          name: "AnomalyDetected",
          state: 429
        });
      }
      log.info(
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
    log.error(
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
  const { client_id = "", redirect_uri = "" }: QueryParams = req.query || {};
  try {
    log.debug(
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
      log.debug(
        `${funcName}: session is destroyed, deleting all refresh tokens associated with session`
      );
      sessionId &&
        refreshTokenService.deleteRefreshTokensDocumentBySessionId(sessionId);
      return resp.status(302).redirect(redirect_uri);
    });
  } catch (error) {
    log.error(
      `${funcName}: Logout failed for client id(${client_id}) with error ${error}`
    );
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

export default {
  signup,
  login,
  logout
};
