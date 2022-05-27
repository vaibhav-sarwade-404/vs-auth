import { Request, Response, NextFunction } from "express";
import tokenService from "../service/token.service";

import log from "../utils/logger";

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
      authorization.replace("Bearer ", "")
    );
    if (!tokenPayload || typeof tokenPayload === "string") {
      throw new Error("Invalid or expired token");
    }
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

export default { validateUserInfoRequest };
