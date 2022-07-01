import { NextFunction, Request, Response, Router } from "express";
import csurf from "csurf";

import { handleAuthorizeRequest } from "./controller/authorizeRedirect.controller";
import pageLoadController from "./controller/pageLoad.controller";
import { errorPageLoadController } from "./controller/error.controller";
import usersController from "./controller/users.controller";
import sessionMiddleware from "./middleware/session.middleware";
import tokenMiddleware from "./middleware/token.middleware";
import oauthController from "./controller/oauth.controller";
import requestValidatorMiddleware from "./middleware/requestValidator.middleware";
import rateLimitMiddleware from "./middleware/rateLimit.middleware";
import HttpException from "./model/HttpException";
import { Logger } from "./utils/logger";
import constants from "./utils/constants";
import clientController from "./controller/client.controller.ts";
import clientMARequestValidatorMiddleware from "./middleware/clientMARequestValidator.middleware";
import pagesMARequestMiddlwareMiddleware from "./middleware/pagesMARequestMiddlware.middleware";
import pagesController from "./controller/pages.controller.ts";
import usersMARequestMiddlwareMiddleware from "./middleware/usersMARequestMiddlware.middleware";

const fileName = "routes.";

class Routes {
  public router = Router();
  private csrfMiddleware = csurf({ cookie: true });
  private use =
    (fn: Function) => (req: Request, resp: Response, next: NextFunction) =>
      Promise.resolve(fn(req, resp, next)).catch(next);
  constructor() {
    this.initPageLoadRoutes();
    this.initUsersRoutes();
    this.initAuthRoutes();
    this.initManagementRoutes();
    this.initGenericRoutes();
  }

  private initPageLoadRoutes() {
    const logger = new Logger(`${fileName}${this.initPageLoadRoutes.name}`);
    this.router.get(
      "/authorize",
      this.csrfMiddleware,
      this.use(requestValidatorMiddleware.authorizeRedirectRequest),
      this.use(sessionMiddleware),
      this.use(handleAuthorizeRequest)
    );

    this.router.get(
      "/login",
      this.csrfMiddleware,
      this.use(requestValidatorMiddleware.loginRedirectRequest),
      this.use(sessionMiddleware),
      this.use(pageLoadController.login)
    );

    //error
    this.router.get(
      "/error",
      this.csrfMiddleware,
      this.use(errorPageLoadController)
    );

    logger.info(`Initialized page load / resource routes`);
  }

  private initUsersRoutes() {
    const logger = new Logger(`${fileName}${this.initUsersRoutes.name}`);

    //users/signup
    this.router.post(
      "/users/signup",
      this.csrfMiddleware,
      this.use(requestValidatorMiddleware.signupRequest),
      this.use(usersController.signup)
    );

    //users/forgot-password
    this.router.post(
      "/users/forgot-password",
      rateLimitMiddleware.forgotPassword,
      this.use(requestValidatorMiddleware.forgotPasswordRequest),
      this.use(usersController.forgotPassword)
    );

    //password-reset/
    this.router.get(
      "/password-reset",
      this.csrfMiddleware,
      this.use(pageLoadController.passwordReset)
    );

    //password-reset/
    this.router.post(
      "/users/password-reset",
      this.csrfMiddleware,
      this.use(requestValidatorMiddleware.passwordReset),
      this.use(usersController.changePassword)
    );

    //users/login
    this.router.post(
      "/users/login",
      this.csrfMiddleware,
      this.use(requestValidatorMiddleware.loginRequest),
      this.use(rateLimitMiddleware.login),
      this.use(usersController.login)
    );

    //users/logout
    this.router.get(
      "/users/logout",
      this.use(requestValidatorMiddleware.logoutRequest),
      this.use(usersController.logout)
    );

    //ticket handler
    this.router.get(
      constants.EMAIL_ACTION_ROUTES.VERIFY_EMAIL,
      this.csrfMiddleware,
      this.use((req: Request, resp: Response, next: NextFunction) => {
        requestValidatorMiddleware.emailAction(req, resp, next, "VERIFY_EMAIL");
      }),
      this.use(usersController.emailAction)
    );

    this.router.get(
      constants.EMAIL_ACTION_ROUTES.PASSWORD_RESET_EMAIL,
      this.csrfMiddleware,
      this.use((req: Request, resp: Response, next: NextFunction) => {
        requestValidatorMiddleware.emailAction(
          req,
          resp,
          next,
          "PASSWORD_RESET_EMAIL"
        );
      }),
      this.use(usersController.emailAction)
    );

    this.router.get(
      constants.EMAIL_ACTION_ROUTES.BLOCKED_ACCOUNT_EMAIL,
      this.csrfMiddleware,
      this.use((req: Request, resp: Response, next: NextFunction) => {
        requestValidatorMiddleware.emailAction(
          req,
          resp,
          next,
          "BLOCKED_ACCOUNT_EMAIL"
        );
      }),
      this.use(usersController.emailAction)
    );

    this.router.get("/test", (req, resp, next) => {
      console.log(req.url);
      resp.status(200).send("OK");
    });

    logger.info(`Initialized user routes`);
  }
  private initAuthRoutes() {
    const logger = new Logger(`${fileName}${this.initAuthRoutes.name}`);

    this.router.options("/oauth/token", (_req: Request, resp: Response) => {
      resp.setHeader("Access-Control-Allow-Origin", "*");
      resp.setHeader("Access-Control-Allow-Methods", "POST");
      resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
      resp.setHeader("Access-Control-Allow-Credentials", "true");
      return resp.status(200).send();
    });

    this.router.options("/userinfo", (_req: Request, resp: Response) => {
      resp.setHeader("Access-Control-Allow-Origin", "*");
      resp.setHeader("Access-Control-Allow-Methods", "POST");
      resp.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization"
      );
      resp.setHeader("Access-Control-Allow-Credentials", "true");
      return resp.status(200).send();
    });

    this.router.post(
      "/oauth/token",
      (_req: Request, resp: Response, next: NextFunction) => {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        next();
      },
      this.use(tokenMiddleware),
      this.use(oauthController.tokenNew)
    );

    this.router.get(
      "/userinfo",
      (_req: Request, resp: Response, next: NextFunction) => {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST");
        resp.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type,Authorization"
        );
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        next();
      },
      this.use(requestValidatorMiddleware.userInfoRequest),
      this.use(rateLimitMiddleware.userInfo),
      this.use(oauthController.userinfo)
    );

    logger.info(`Initialized Auth routes`);
  }

  private initManagementRoutes() {
    const logger = new Logger(`${fileName}${this.initManagementRoutes.name}`);

    //get client by id
    this.router.get(
      "/v1/management/clients/:clientId",
      this.use(clientMARequestValidatorMiddleware.getClient),
      this.use(clientController.getClient)
    );

    //update client by id
    this.router.patch(
      "/v1/management/clients/:clientId",
      this.use(clientMARequestValidatorMiddleware.updateClient),
      this.use(clientController.updateClient)
    );

    //update client by id
    this.router.delete(
      "/v1/management/clients/:clientId",
      this.use(clientMARequestValidatorMiddleware.deleteClient),
      this.use(clientController.deleteClient)
    );

    //create new clients
    this.router.post(
      "/v1/management/clients",
      this.use(clientMARequestValidatorMiddleware.createClient),
      this.use(clientController.createClient)
    );

    //rotate secret by client id
    this.router.post(
      "/v1/management/clients/:clientId/rotate-secret",
      this.use(clientMARequestValidatorMiddleware.rotateClientSecret),
      this.use(clientController.rotateClientSecret)
    );

    //update page html
    this.router.patch(
      "/v1/management/pages/:page",
      this.use(pagesMARequestMiddlwareMiddleware.updatePage),
      this.use(pagesController.updatePage)
    );

    //get user
    this.router.get(
      "/v1/management/users/:userId",
      this.use(usersMARequestMiddlwareMiddleware.getUser),
      this.use(usersController.getUser)
    );

    //update user
    this.router.patch(
      "/v1/management/users/:userId",
      this.use(usersMARequestMiddlwareMiddleware.updateUser),
      this.use(usersController.updateUser)
    );

    //delete user
    this.router.delete(
      "/v1/management/users/:userId",
      this.use(usersMARequestMiddlwareMiddleware.deleteUser),
      this.use(usersController.deletUser)
    );

    //create user
    this.router.post(
      "/v1/management/users/:userId",
      this.use(usersMARequestMiddlwareMiddleware.createUser),
      usersController.createUser
    );

    logger.info(`Initialized management routes`);
  }

  private initGenericRoutes() {
    const logger = new Logger(`${fileName}${this.initGenericRoutes.name}`);

    //all other routes return 404 not found
    this.router.all("/", (_req: Request, _res: Response) => {
      throw new HttpException(400, "Not found");
    });

    logger.info(`Initialized generic routes`);
  }
}

export default Routes;
