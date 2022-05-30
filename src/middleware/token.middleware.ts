import { Request, Response, NextFunction } from "express";

import authorizationcodeService from "../service/authorizationcode.service";
import refreshTokenService from "../service/refreshToken.service";
import { ParsedAuthorizationCodeDocument } from "../types/AuthorizationCodeModel";
import { ParsedRefreshTokenDocument } from "../types/RefreshTokenModel";
import { TokenRequest } from "../types/Request";
import log from "../utils/logger";

export default async (req: Request, resp: Response, next: NextFunction) => {
  const funcName = "token.middleware";
  const {
    grant_type: grantType = "authorization_code",
    client_id: clientId = "",
    redirect_uri: callbackURL,
    code_verifier: codeVerifier = "",
    code = "",
    refresh_token = "",
    scope = ""
  }: TokenRequest = req.body;
  try {
    if (grantType === "authorization_code" && code) {
      const authorizationCodeDocument: ParsedAuthorizationCodeDocument =
        await authorizationcodeService.getAuthourizationCodeDocumentByIdAndLock(
          code
        );
      if (authorizationCodeDocument) {
        if (
          authorizationCodeDocument.payload.clientId === clientId &&
          authorizationCodeDocument.payload.callbackURL === callbackURL
        ) {
          const isValidAuthorizationCode =
            await authorizationcodeService.isCodeVerifierValid(
              authorizationCodeDocument,
              codeVerifier
            );
          if (
            isValidAuthorizationCode &&
            (req.session.user || {}).authorizationCode !==
              authorizationCodeDocument.code
          ) {
            req.session.user = {
              ...(req.session.user || {}),
              userId: (authorizationCodeDocument.payload || {}).userId,
              scope,
              isAuthenticated: true,
              authorizationCode: authorizationCodeDocument.code,
              _sessionId: authorizationCodeDocument.sessionId
            };
            return next();
          }
        }
      }
      log.info(
        `${funcName}: validation failed for authorization code, returning invalid code error`
      );
      return resp.status(403).json({
        error: "Invalid Authorization code"
      });
    } else if (grantType === "refresh_token" && refresh_token) {
      const refreshTokenDocument: ParsedRefreshTokenDocument =
        await refreshTokenService.getRefreshTokenDocumentAndLock(refresh_token);
      if (refreshTokenDocument) {
        if (
          refreshTokenDocument.clientId === clientId &&
          refreshTokenDocument.payload.callbackURL === callbackURL
        ) {
          req.session.user = {
            ...(req.session.user || {}),
            userId: (refreshTokenDocument.payload || {}).userId,
            scope,
            isAuthenticated: true
          };
          return next();
        }
      }
      log.info(
        `${funcName}: validation failed for refresh token returning invalid refresh token error`
      );
      return resp.status(403).json({
        error: "Invalid refresh token"
      });
    }
    return resp.status(400).json({
      error: "Invalid request"
    });
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while retriving session to check authentication with error: ${error}`
    );
    return resp.status(403).json({
      error: "Invalid Authorization code"
    });
  }
};
