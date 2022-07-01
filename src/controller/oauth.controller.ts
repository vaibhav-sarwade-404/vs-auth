import { NextFunction, Request, Response } from "express";

import usersService from "../service/users.service";
import tokenService from "../service/token.service";
import log from "../utils/logger";
import authorizationcodeService from "../service/authorizationcode.service";
import { TokenRequest } from "../types/Request";
import {
  AuthorizationCodeRequest,
  RefreshTokenRequest
} from "../types/TokenModel";
import refreshTokenService from "../service/refreshToken.service";
import logService from "../service/log.service";
import clientsService from "../service/clients.service";
import RequestValidationError from "../model/RequestValidationError.Model";
import HttpException, { UnauthorizedError } from "../model/HttpException";
import { UserDocument } from "../types/UsersModel";

const token = async (req: Request, resp: Response) => {
  const funcName = `oauth.controller.${token.name}`;
  try {
    const {
      grant_type,
      redirect_uri: callbackURL = "",
      client_id: clientId = ""
    }: TokenRequest = req.body || {};
    const {
      userId = "",
      isAuthenticated = false,
      scope = "", //remove it from here read it form body
      audience = "",
      _sessionId
    } = req.session.user;
    if (isAuthenticated) {
      const userDocument = await usersService.findUserById(userId);
      if (userDocument) {
        const tokenResponse = await tokenService.prepareEndUserTokenResponse({
          user: userDocument,
          clientId,
          scope,
          grant_type,
          callbackURL,
          audience,
          sessionId: _sessionId || ""
        });

        if (tokenResponse) {
          if (grant_type === "authorization_code") {
            const { code }: AuthorizationCodeRequest = req.body || {};
            await authorizationcodeService.deleteAuthourizationCodeDocumentById(
              code
            );
            req.session.user.authorizationCode = undefined;
            req.session.user.isAuthenticated = false;
          } else if (grant_type === "refresh_token") {
            const { refresh_token: refreshToken = "" }: RefreshTokenRequest =
              req.body || {};
            await refreshTokenService.deleteRefreshTokenDocument(refreshToken);
          }
          return resp.status(200).json(tokenResponse);
        }
      }
    }
    log.info(
      `${funcName}: either user is not authenticated or user not found, returning error for token endpoint`
    );

    const error_message =
      grant_type === "authorization_code"
        ? "Invalid authorization code"
        : "Invalid refresh token";
    if (req.logDocument) {
      req.logDocument.type =
        grant_type === "authorization_code"
          ? "failed_code_exchange"
          : "failed_refresh_token_exchange";
      req.logDocument.decription = error_message;
      req.logDocument.client_id = clientId;
      logService.createLogEvent(req.logDocument);
    }
    return resp.status(403).json({
      error: "unauthorized",
      error_message
    });
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generating token reponse with error: ${error}`
    );
    return resp.status(500).json({
      error: "something went wrong"
    });
  }
};

const userinfo = async (req: Request, resp: Response) => {
  const funcName = `oauth.controller.${userinfo.name}`;
  try {
    const { userId, isAuthenticated } = req.session.user;
    if (isAuthenticated && userId) {
      const userDocument = await usersService.findUserById(userId);
      return resp.status(200).json({
        email: userDocument.email,
        ...(userDocument.user_metadata?.firstName
          ? { firstName: userDocument.user_metadata?.firstName }
          : {}),
        ...(userDocument.user_metadata?.lastName
          ? { lastName: userDocument.user_metadata?.lastName }
          : {})
      });
    }
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generating userinfo reponse with error: ${error}`
    );
    return resp.status(500).json({
      error: "something went wrong"
    });
  }
};

const tokenNew = async (req: Request, resp: Response, next: NextFunction) => {
  const funcName = `oauth.controller.${token.name}`;
  try {
    const {
      grant_type,
      redirect_uri: callbackURL = "",
      client_id: clientId = "",
      scope = ""
    }: TokenRequest = req.body || {};
    const {
      userId = "",
      _sessionId,
      apiDocument = {
        identifier: "",
        name: "",
        permissions: [""],
        tokenExpiry: 0,
        tokenSigningAlgo: "",
        type: ""
      }
    } = req.session.user || {};
    let userDocument: UserDocument = {
      email: "",
      email_verified: false,
      password: "",
      passwordHistory: [],
      _id: "",
      blocked_for: [],
      login_count: 0,
      user_metadata: { firstName: "", lastName: "" }
    };
    if (userId) {
      userDocument = await usersService.findUserById(userId);
    }
    const tokenResponse = await tokenService.prepareTokenResponse({
      callbackURL,
      clientId,
      grant_type,
      scope,
      sessionId: _sessionId || "",
      user: userDocument,
      apiDocument
    });
    if (tokenResponse) {
      return resp.status(200).send(tokenResponse);
    }
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generating token reponse with error: ${error}`
    );
    return next(new HttpException());
  }
};

export default {
  token,
  userinfo,
  tokenNew
};
