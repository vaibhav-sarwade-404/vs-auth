import { Request, Response, NextFunction } from "express";
import authorizationcodeService from "../service/authorizationcode.service";
import { ParsedAuthorizationCodeDocument } from "../types/AuthorizationCodeModel";

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
    scope = ""
  }: TokenRequest = req.body;
  try {
    if (grantType === "authorization_code" && code) {
      const authorizationCodeDocument: ParsedAuthorizationCodeDocument =
        await authorizationcodeService.getAuthourizationCodeDocumentById(code);
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
          if (isValidAuthorizationCode) {
            req.session.user = {
              ...(req.session.user || {}),
              userId: (authorizationCodeDocument.payload || {}).userId,
              scope,
              isAuthenticated: true
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
    }
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while retriving session to check authentication with error: ${error}`
    );
    return resp.status(403).json({
      error: "Invalid Authorization code"
    });
  }
};
