import { NextFunction, Request, Response } from "express";
import loginRateLimitService from "../service/loginRateLimit.service";
import userInfoRateLimitService from "../service/userInfoRateLimit.service";
import { RateLimitResponse } from "../types/Response";
import constants from "../utils/constants";
import log from "../utils/logger";

const fileName = "rateLimit.middleware";

const prepareAndSendRateLimitResponse = (
  resp: Response,
  next: NextFunction,
  rateLimitResponeDocument: RateLimitResponse
) => {
  const funcName = `${fileName}.${prepareAndSendRateLimitResponse.name}`;
  const remainingRateLimit =
    rateLimitResponeDocument.points - rateLimitResponeDocument.consumedPoints;
  resp.setHeader("X-RateLimit-Limit", rateLimitResponeDocument.points);
  resp.setHeader(
    "X-RateLimit-Remaining",
    remainingRateLimit > -1 ? remainingRateLimit : 0
  );
  resp.setHeader("X-RateLimit-Reset", rateLimitResponeDocument.resetIn);
  log.info(
    `${funcName}: rate limit reached for key (${rateLimitResponeDocument.key})`
  );
  return rateLimitResponeDocument.isRateLimitReached
    ? resp.status(429).send("Too Many Requests")
    : next();
};

const login = async (req: Request, resp: Response, next: NextFunction) => {
  const funcName = `${fileName}.${login.name}`;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const key = `${constants.RATE_LIMIT_KEYS.loginApi}${ip}`;
  const loginRateLimitResponseDocument: RateLimitResponse =
    await loginRateLimitService.consume(
      `${constants.RATE_LIMIT_KEYS.loginApi}${ip.toString()}`,
      1
    );

  if (loginRateLimitResponseDocument) {
    log.info(
      `${funcName}: preparing rate limit response / headers for key (${key})`
    );
    return prepareAndSendRateLimitResponse(
      resp,
      next,
      loginRateLimitResponseDocument
    );
  }
  next();
};

const userInfo = async (req: Request, resp: Response, next: NextFunction) => {
  const funcName = `${fileName}.${userInfo.name}`;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const key = `${constants.RATE_LIMIT_KEYS.userInfoApi}${ip}`;
  const userInfoRateLimitResponseDocument: RateLimitResponse =
    await userInfoRateLimitService.consume(
      `${constants.RATE_LIMIT_KEYS.userInfoApi}${ip}`,
      1
    );
  if (userInfoRateLimitResponseDocument) {
    log.info(`${funcName}: Rate limit reached for key ${key}, returning 429`);
    return prepareAndSendRateLimitResponse(
      resp,
      next,
      userInfoRateLimitResponseDocument
    );
  }
  next();
};

export default {
  login,
  userInfo
};
