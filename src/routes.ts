import { Express, Request, Response } from "express";

import validateAuthorizeRequest from "./middleware/validateAuthorizeRequest";
import { handleAuthorize } from "./controller/authorize.controller";
import validateLoginRequest from "./middleware/validateLoginRequest";
import { loginPageLoadController } from "./controller/login.controller";
import { errorPageLoadController } from "./controller/error.controller";
import constants from "./utils/constants";
import validateSignupRequest from "./middleware/validateSignupRequest";
import usersController from "./controller/users.controller";

const routes = (app: Express) => {
  //Test health check
  // app.get("/healthcheck", (req: Request, res: Response) => {
  //   return res.sendStatus(200);
  // });

  //authorize redirect
  app.get("/authorize", validateAuthorizeRequest, handleAuthorize);

  //login-page-load
  app.get("/login", validateLoginRequest, loginPageLoadController);

  //error
  app.get("/error", errorPageLoadController);

  //error
  app.get("/cleanup", errorPageLoadController);

  //users/signup
  app.post("/users/signup", validateSignupRequest, usersController.signup);

  //all other routes return 404 not found
  app.get("/*", (req: Request, res: Response) =>
    res.status(404).send(constants.ERROR_STRINGS.notFound)
  );
};

export default routes;
