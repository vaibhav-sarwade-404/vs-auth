import { Request, Response, NextFunction } from "express";

import { Logger } from "../utils/logger";
import { UserRUDWithPathParam } from "../types/Request";
import RequestValidationError from "../model/RequestValidationError.Model";
import HttpException from "../model/HttpException";
import {
  SchemaValidationError,
  SchemaValidator
} from "../utils/SchemaValidator";
import constants from "../utils/constants";
import mongoose from "mongoose";
import { IncomingHttpHeaders } from "http";
import { JwtPayload } from "jsonwebtoken";
import tokenService from "../service/token.service";

const fileName = "userssMARequestValidator.middleware";

const getTokenPayload = (headers: IncomingHttpHeaders): string | JwtPayload => {
  const { authorization = "" } = headers;
  const token = authorization.replace("Bearer ", "");
  return tokenService.verifyAccessToken(token, {
    audience: "https://management.api.vsauth.com",
    issuer: "vs-auth",
    algorithms: ["RS256"]
  });
};

const getUser = async (req: Request, _resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${getUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const tokenPayload = getTokenPayload(req.headers);
    if (
      !tokenPayload ||
      typeof tokenPayload === "string" ||
      !(tokenPayload.scope || []).includes("users:read")
    ) {
      return next(
        new HttpException(403, "unauthorize", "Invalid or expired access token")
      );
    }
    const validationError = new RequestValidationError();
    if (!userId) {
      validationError.addError = {
        field: "userId",
        error: `userId is required`
      };
      return next(validationError);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      validationError.addError = {
        field: "userId",
        error: `userId is invalid`
      };
      return next(validationError);
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating get user(${userId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const updateUser = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const tokenPayload = getTokenPayload(req.headers);
  if (
    !tokenPayload ||
    typeof tokenPayload === "string" ||
    !(tokenPayload.scope || []).includes("users:update")
  ) {
    return next(
      new HttpException(403, "unauthorize", "Invalid or expired access token")
    );
  }
  const logger = new Logger(`${fileName}.${updateUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const schemaValidatorInstance = SchemaValidator.getInstance({});
    const schemValidationErrors = schemaValidatorInstance.validate(
      constants.validationSchemaNames.updateUser,
      req.body
    );
    if (
      schemValidationErrors instanceof SchemaValidationError &&
      schemValidationErrors.hasSchemaValidationError()
    ) {
      return next(schemValidationErrors);
    }

    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating update user(${userId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const deleteUser = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const tokenPayload = getTokenPayload(req.headers);
  if (
    !tokenPayload ||
    typeof tokenPayload === "string" ||
    !(tokenPayload.scope || []).includes("users:delete")
  ) {
    return next(
      new HttpException(403, "unauthorize", "Invalid or expired access token")
    );
  }
  const logger = new Logger(`${fileName}.${deleteUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const validationError = new RequestValidationError();
    if (!userId) {
      validationError.addError = {
        field: "userId",
        error: `userId is required`
      };
      return next(validationError);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      validationError.addError = {
        field: "userId",
        error: `userId is invalid`
      };
      return next(validationError);
    }
    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating delete user(${userId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

const createUser = async (
  req: Request,
  _resp: Response,
  next: NextFunction
) => {
  const tokenPayload = getTokenPayload(req.headers);
  if (
    !tokenPayload ||
    typeof tokenPayload === "string" ||
    !(tokenPayload.scope || []).includes("users:create")
  ) {
    return next(
      new HttpException(403, "unauthorize", "Invalid or expired access token")
    );
  }
  const logger = new Logger(`${fileName}.${createUser.name}`);
  const { userId }: UserRUDWithPathParam = req.params;
  try {
    const schemaValidatorInstance = SchemaValidator.getInstance({});
    const schemValidationErrors = schemaValidatorInstance.validate(
      constants.validationSchemaNames.createUser,
      req.body
    );
    if (
      schemValidationErrors instanceof SchemaValidationError &&
      schemValidationErrors.hasSchemaValidationError()
    ) {
      return next(schemValidationErrors);
    }

    return next();
  } catch (error) {
    logger.error(
      `Something went wrong while validating update user(${userId}) request with error: ${error}`
    );
    return next(new HttpException());
  }
};

export default {
  getUser,
  updateUser,
  deleteUser,
  createUser
};
