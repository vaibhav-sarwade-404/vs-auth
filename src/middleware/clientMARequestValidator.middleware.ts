import { Request, Response, NextFunction } from "express";

import { Logger } from "../utils/logger";
import {
  ClientRUDWithPathParam,
  CreateClientRequest,
  UpdateClientRequest
} from "../types/Request";
import RequestValidationError from "../model/RequestValidationError.Model";
import apiService from "../service/api.service";
import HttpException from "../model/HttpException";
import {
  SchemaValidationError,
  SchemaValidator
} from "../utils/SchemaValidator";
import constants from "../utils/constants";
import tokenService from "../service/token.service";
import { JwtPayload } from "jsonwebtoken";
import { IncomingHttpHeaders } from "http";

const fileName = "clientMARequestValidator.middleware";

const getTokenPayload = (headers: IncomingHttpHeaders): string | JwtPayload => {
  const { authorization = "" } = headers;
  const token = authorization.replace("Bearer ", "");
  return tokenService.verifyAccessToken(token, {
    audience: "https://management.api.vsauth.com",
    issuer: "vs-auth",
    algorithms: ["RS256"]
  });
};

const createClient = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${createClient.name}`);
  try {
    const tokenPayload = getTokenPayload(req.headers);
    if (
      !tokenPayload ||
      typeof tokenPayload === "string" ||
      !(tokenPayload.scope || []).includes("applications:create")
    ) {
      return next(
        new HttpException(403, "unauthorize", "Invalid or expired access token")
      );
    }
    const schemaValidatorInstance = SchemaValidator.getInstance({});
    const { applicationType, api }: CreateClientRequest = req.body;
    const schemValidationErrors = schemaValidatorInstance.validate(
      applicationType === "m2m"
        ? constants.validationSchemaNames.createM2MClient
        : constants.validationSchemaNames.createClient,
      req.body
    );
    if (
      schemValidationErrors instanceof SchemaValidationError &&
      schemValidationErrors.hasSchemaValidationError()
    ) {
      return next(schemValidationErrors);
    }
    const validationError = new RequestValidationError();
    if (applicationType === "m2m") {
      if (!api) {
        validationError.addError = {
          field: "api",
          error: `${api} details required`
        };
        return next(validationError);
      }
      if (!api.apiId || !api.scopes) {
        validationError.addError = {
          field: "api",
          error: `${api} details (apiId , scopes) are required`
        };
        return next(validationError);
      }
      const apiDocument = await apiService.findByApiId(api.apiId);
      if (!apiDocument) {
        validationError.addError = {
          field: "api.apiId",
          error: `${api.apiId} is not a valid apiId`
        };
        return next(validationError);
      }
      const scope = api.scopes.find(
        _scope => !apiDocument.permissions.includes(_scope)
      );
      if (scope) {
        validationError.addError = {
          field: "api.scopes",
          error: `${scope} is not a valid scope`
        };
        return next(validationError);
      }
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating create client request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const getClient = async (req: Request, _resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${getClient.name}`);
  const { clientId }: ClientRUDWithPathParam = req.params;
  try {
    const tokenPayload = getTokenPayload(req.headers);
    if (
      !tokenPayload ||
      typeof tokenPayload === "string" ||
      !(tokenPayload.scope || []).includes("applications:read")
    ) {
      return next(
        new HttpException(403, "unauthorize", "Invalid or expired access token")
      );
    }
    const validationError = new RequestValidationError();
    if (!clientId) {
      validationError.addError = {
        field: "clientId",
        error: `clientId is required in path param`
      };
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating get client(${clientId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const deleteClient = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${deleteClient.name}`);
  const { clientId }: ClientRUDWithPathParam = req.params;
  try {
    const tokenPayload = getTokenPayload(req.headers);
    if (
      !tokenPayload ||
      typeof tokenPayload === "string" ||
      !(tokenPayload.scope || []).includes("applications:delete")
    ) {
      return next(
        new HttpException(403, "unauthorize", "Invalid or expired access token")
      );
    }
    const scope = tokenPayload.scope || [];
    const validationError = new RequestValidationError();
    if (!clientId) {
      validationError.addError = {
        field: "clientId",
        error: `clientId is required in path param`
      };
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating delete client(${clientId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const updateClient = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${updateClient.name}`);
  const { clientId }: ClientRUDWithPathParam = req.params;
  try {
    const tokenPayload = getTokenPayload(req.headers);
    if (
      !tokenPayload ||
      typeof tokenPayload === "string" ||
      !(tokenPayload.scope || []).includes("applications:update")
    ) {
      return next(
        new HttpException(403, "unauthorize", "Invalid or expired access token")
      );
    }
    const schemaValidatorInstance = SchemaValidator.getInstance({});
    const { api }: UpdateClientRequest = req.body;
    const schemValidationErrors = schemaValidatorInstance.validate(
      constants.validationSchemaNames.updateClient,
      req.body
    );
    if (
      schemValidationErrors instanceof SchemaValidationError &&
      schemValidationErrors.hasSchemaValidationError()
    ) {
      return next(schemValidationErrors);
    }
    const validationError = new RequestValidationError();
    if (api) {
      const apiDocument = await apiService.findByApiId(api.apiId);
      if (!apiDocument) {
        validationError.addError = {
          field: "api.apiId",
          error: `${api.apiId} is not a valid apiId`
        };
        return next(validationError);
      }
      const scope = api.scopes.find(
        _scope => !apiDocument.permissions.includes(_scope)
      );
      if (scope) {
        validationError.addError = {
          field: "api.scopes",
          error: `${scope} is not a valid scope`
        };
        return next(validationError);
      }
    }

    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating updateClient client(${clientId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const rotateClientSecret = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${deleteClient.name}`);
  const { clientId: clientIdParam }: ClientRUDWithPathParam = req.params;
  const { clientId: clientIdBody } = req.body;
  try {
    const tokenPayload = getTokenPayload(req.headers);
    if (
      !tokenPayload ||
      typeof tokenPayload === "string" ||
      !(tokenPayload.scope || []).includes("applications:update")
    ) {
      return next(
        new HttpException(403, "unauthorize", "Invalid or expired access token")
      );
    }
    const validationError = new RequestValidationError();
    if (!clientIdParam) {
      validationError.addError = {
        field: "clientId",
        error: `clientId is required in path param`
      };
      return next(validationError);
    }
    if (clientIdParam !== clientIdBody) {
      validationError.addError = {
        field: "clientId",
        error: `clientId is should match in path param and body`
      };
      return next(validationError);
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating delete client(${clientIdParam}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

export default {
  createClient,
  getClient,
  updateClient,
  deleteClient,
  rotateClientSecret
};
