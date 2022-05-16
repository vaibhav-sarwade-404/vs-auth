import { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";

import validateAuthorize from "./middleware/validateAuthorizeRequest";
import { handleAuthorize } from "./controller/authorize.controller";
import validateLoginRequest from "./middleware/validateLoginRequest";
import { loginPageLoadController } from "./controller/login.controller";

const routes = (app: Express) => {
  //Test health check
  app.get("/healthcheck", (req: Request, res: Response) => {
    return res.sendStatus(200);
  });

  //authorize
  app.get("/authorize", validateAuthorize, handleAuthorize);

  //login
  app.get("/login", validateLoginRequest, loginPageLoadController);

  //error
  app.get("/error", (req: Request, res: Response) => {
    return res.status(200).sendFile(path.join(__dirname, `/pages/error.html`));
  });
};

export default routes;
