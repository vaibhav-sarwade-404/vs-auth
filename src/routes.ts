import { Express, NextFunction, Request, Response } from "express";
import { RateLimiterMongo } from "rate-limiter-flexible";

import { handleAuthorizeRequest } from "./controller/authorizeRedirect.controller";
import { loginPageLoadController } from "./controller/loginPageLoad.controller";
import { errorPageLoadController } from "./controller/error.controller";
import constants from "./utils/constants";
import usersController from "./controller/users.controller";
import sessionMiddleware from "./middleware/session.middleware";
import tokenMiddleware from "./middleware/token.middleware";
import csurf from "csurf";
import oauthController from "./controller/oauth.controller";
import requestValidatorMiddleware from "./middleware/requestValidator.middleware";
import loginRateLimitService from "./service/loginRateLimit.service";
import rateLimitMiddleware from "./middleware/rateLimit.middleware";

const routes = (app: Express) => {
  //Test health check
  // app.get("/healthcheck", (req: Request, res: Response) => {
  //   return res.sendStatus(200);
  // });

  const csrfMiddleware = csurf({ cookie: true });

  //authorize redirect
  app.get(
    "/authorize",
    csrfMiddleware,
    requestValidatorMiddleware.authorizeRedirectRequest,
    sessionMiddleware,
    handleAuthorizeRequest
  );

  //login-page-load
  app.get(
    "/login",
    csrfMiddleware,
    requestValidatorMiddleware.loginRedirectRequest,
    sessionMiddleware,
    loginPageLoadController
  );

  //error
  app.get("/error", csrfMiddleware, errorPageLoadController);

  //error
  app.get("/cleanup", errorPageLoadController);

  //users/signup
  app.post(
    "/users/signup",
    csrfMiddleware,
    requestValidatorMiddleware.signupRequest,
    usersController.signup
  );

  // async (req: Request, resp: Response, next: NextFunction) => {
  //   loginRateLimiter
  //     .consume(req.ip, 1)
  //     .then(rateLimiterResp => {
  //       resp.setHeader("X-RateLimit-Limit", 10);
  //       resp.setHeader(
  //         "X-RateLimit-Remaining",
  //         rateLimiterResp.remainingPoints
  //       );
  //       resp.setHeader(
  //         "X-RateLimit-Reset",
  //         Date.now() + rateLimiterResp.msBeforeNext
  //       );
  //       next();
  //     })
  //     .catch(_ => {
  //       resp.status(429).send("Too Many Requests");
  //     });
  // },

  //users/login
  app.post(
    "/users/login",
    csrfMiddleware,
    requestValidatorMiddleware.loginRequest,
    rateLimitMiddleware.login,
    usersController.login
  );

  //users/logout
  app.get(
    "/users/logout",
    requestValidatorMiddleware.validateLogoutRequest,
    usersController.logout
  );

  app.options("/oauth/token", (_req, resp, next) => {
    resp.setHeader("Access-Control-Allow-Origin", "*");
    resp.setHeader("Access-Control-Allow-Methods", "POST");
    resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    resp.setHeader("Access-Control-Allow-Credentials", "true");
    return resp.status(200).send();
  });

  app.options("/userinfo", (_req, resp, next) => {
    resp.setHeader("Access-Control-Allow-Origin", "*");
    resp.setHeader("Access-Control-Allow-Methods", "POST");
    resp.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization"
    );
    resp.setHeader("Access-Control-Allow-Credentials", "true");
    return resp.status(200).send();
  });

  app.post(
    "/oauth/token",
    (_req, resp, next) => {
      resp.setHeader("Access-Control-Allow-Origin", "*");
      resp.setHeader("Access-Control-Allow-Methods", "POST");
      resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
      resp.setHeader("Access-Control-Allow-Credentials", "true");
      next();
    },
    tokenMiddleware,
    oauthController.token
  );

  app.get(
    "/userinfo",
    (_req, resp, next) => {
      resp.setHeader("Access-Control-Allow-Origin", "*");
      resp.setHeader("Access-Control-Allow-Methods", "POST");
      resp.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization"
      );
      resp.setHeader("Access-Control-Allow-Credentials", "true");
      next();
    },
    requestValidatorMiddleware.validateUserInfoRequest,
    rateLimitMiddleware.userInfo,
    oauthController.userinfo
  );

  //all other routes return 404 not found
  app.get("/*", (_req: Request, res: Response) =>
    res.status(404).send(constants.ERROR_STRINGS.notFound)
  );
};

export default routes;
