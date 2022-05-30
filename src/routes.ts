import { Express, Request, Response } from "express";

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

  //users/login
  app.post(
    "/users/login",
    csrfMiddleware,
    requestValidatorMiddleware.loginRequest,
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
    oauthController.userinfo
  );

  //all other routes return 404 not found
  app.get("/*", (_req: Request, res: Response) =>
    res.status(404).send(constants.ERROR_STRINGS.notFound)
  );
};

export default routes;
