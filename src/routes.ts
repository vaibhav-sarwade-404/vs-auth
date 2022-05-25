import { Express, Request, Response } from "express";

import validateAuthorizeRequest from "./middleware/validateAuthorizeRequest.middleware";
import { handleAuthorizeRequest } from "./controller/authorizeRedirect.controller";
import validateLoginResourceHandlerRequest from "./middleware/validateLoginResourceHandlerRequest.middleware";
import { loginPageLoadController } from "./controller/login.controller";
import { errorPageLoadController } from "./controller/error.controller";
import constants from "./utils/constants";
import validateSignupRequest from "./middleware/validateSignupRequest.middleware";
import usersController from "./controller/users.controller";
import sessionMiddleware from "./middleware/session.middleware";

const routes = (app: Express) => {
  //Test health check
  // app.get("/healthcheck", (req: Request, res: Response) => {
  //   return res.sendStatus(200);
  // });

  //authorize redirect
  app.get(
    "/authorize",
    validateAuthorizeRequest,
    sessionMiddleware,
    handleAuthorizeRequest
  );

  //login-page-load
  app.get(
    "/login",
    validateLoginResourceHandlerRequest,
    sessionMiddleware,
    loginPageLoadController
  );

  //error
  app.get("/error", errorPageLoadController);

  //error
  app.get("/cleanup", errorPageLoadController);

  //users/signup
  app.post("/users/signup", validateSignupRequest, usersController.signup);

  //users/login
  app.post("/users/login", validateSignupRequest, usersController.login);

  //all other routes return 404 not found
  app.get("/*", (req: Request, res: Response) =>
    res.status(404).send(constants.ERROR_STRINGS.notFound)
  );
};

export default routes;
