import { Request, Response, NextFunction } from "express";
import HttpException, { UnauthorizedError } from "../model/HttpException";
import RequestValidationError from "../model/RequestValidationError.Model";
import apiService from "../service/api.service";

import authorizationcodeService from "../service/authorizationcode.service";
import clientsService from "../service/clients.service";
import refreshTokenService from "../service/refreshToken.service";
import { ParsedAuthorizationCodeDocument } from "../types/AuthorizationCodeModel";
import { ParsedRefreshTokenDocument } from "../types/RefreshTokenModel";
import { TokenRequest } from "../types/Request";
import constants from "../utils/constants";
import log from "../utils/logger";
import { SchemaValidator } from "../utils/SchemaValidator";

export default async (req: Request, _resp: Response, next: NextFunction) => {
  const funcName = "token.middleware";
  const {
    grant_type: grantType = "authorization_code",
    client_id: clientId = "",
    redirect_uri: callbackURL,
    code_verifier: codeVerifier = "",
    client_secret = "",
    audience = "",
    code = "",
    refresh_token = "",
    scope = ""
  }: TokenRequest = req.body;
  try {
    const validationError = new RequestValidationError();
    const schemaValidatorInstance = SchemaValidator.getInstance({});
    if (grantType === "authorization_code") {
      const {}: TokenRequest = req.body;
      const schemValidationErrors = schemaValidatorInstance.validate(
        constants.validationSchemaNames.authorizeCodeGrantExchange,
        req.body
      );
      if (schemValidationErrors.hasSchemaValidationError()) {
        log.info(
          `${funcName}: validation failed for authorization code, returning error`
        );
        return next(schemValidationErrors);
      }
      const authorizationCodeDocument: ParsedAuthorizationCodeDocument =
        await authorizationcodeService.getAuthourizationCodeDocumentByIdAndLock(
          code
        );
      if (!authorizationCodeDocument) {
        validationError.addError = {
          field: "code",
          error: "invalid authorization code"
        };
        return next(validationError);
      }
      if (authorizationCodeDocument.payload.clientId === clientId) {
        validationError.addError = {
          field: "client_id",
          error: "invalid client_id"
        };
        return next(validationError);
      }
      if (authorizationCodeDocument.payload.callbackURL === callbackURL) {
        validationError.addError = {
          field: "redirect_uri",
          error: "invalid redirect_uri"
        };
        return next(validationError);
      }
      const clientDocument = await clientsService.getClientByClientId(clientId);
      const apiDocument = await apiService.findByApiId(
        clientDocument.api.apiId
      );
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
            audience: authorizationCodeDocument.payload.audience,
            apiDocument,
            _sessionId: authorizationCodeDocument.sessionId
          };
          return next();
        }
      }
    } else if (grantType === "refresh_token") {
      const schemValidationErrors = schemaValidatorInstance.validate(
        constants.validationSchemaNames.refreshTokenGrantExchange,
        req.body
      );
      if (schemValidationErrors.hasSchemaValidationError()) {
        log.info(
          `${funcName}: validation failed for refresh token returning error`
        );
        return next(schemValidationErrors);
      }
      const refreshTokenDocument: ParsedRefreshTokenDocument =
        await refreshTokenService.getRefreshTokenDocumentAndLock(refresh_token);
      if (refreshTokenDocument) {
        if (
          refreshTokenDocument.clientId === clientId &&
          refreshTokenDocument.payload.callbackURL === callbackURL
        ) {
          const clientDocument = await clientsService.getClientByClientId(
            clientId
          );
          const apiDocument = await apiService.findByApiId(
            clientDocument.api.apiId
          );
          req.session.user = {
            ...(req.session.user || {}),
            userId: (refreshTokenDocument.payload || {}).userId,
            scope,
            apiDocument,
            isAuthenticated: true
          };
          return next();
        }
      }
      return next(new UnauthorizedError("Invalid refresh token"));
    } else if (grantType === "client_credentials") {
      const schemValidationErrors = schemaValidatorInstance.validate(
        constants.validationSchemaNames.clientCredentialGrantExchange,
        req.body
      );
      if (schemValidationErrors.hasSchemaValidationError()) {
        log.info(
          `${funcName}: validation failed for client credential grant returning error`
        );
        return next(schemValidationErrors);
      }
      const clientDocument = await clientsService.getClientByClientId(clientId);
      if (!clientDocument) {
        validationError.addError = {
          field: "client_id",
          error: "client_id is invalid"
        };
        return next(validationError);
      }
      if (
        clientDocument.clientSecret !== client_secret ||
        !clientDocument.grantTypes.includes(grantType)
      ) {
        return next(new HttpException(401, "access_denied", "Unauthorized"));
      }
      const apiDocument = await apiService.findByApiId(
        clientDocument.api.apiId
      );
      if (
        !apiDocument ||
        (apiDocument && apiDocument.identifier !== audience)
      ) {
        validationError.addError = {
          field: "audience",
          error: "audience is invalid"
        };
        return next(validationError);
      }
      req.session.user = {
        ...(req.session.user || {}),
        scope,
        apiDocument,
        isAuthenticated: true
      };
      return next();
    }
    return next(new HttpException(401, "access_denied", "Unauthorized"));
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while retriving session to check authentication with error: ${error}`
    );
    return next(new HttpException(401, "access_denied", "Unauthorized"));
  }
};
