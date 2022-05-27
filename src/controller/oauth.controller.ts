import { Request, Response } from "express";

import usersService from "../service/users.service";
import tokenService from "../service/token.service";
import log from "../utils/logger";
import authorizationcodeService from "../service/authorizationcode.service";

const token = async (req: Request, resp: Response) => {
  const funcName = `oauth.controller.${token.name}`;
  try {
    const { code = "" } = req.body || {};
    const {
      userId = "",
      isAuthenticated = false,
      scope = "",
      clientId = ""
    } = req.session.user;
    if (isAuthenticated) {
      const userDocument = await usersService.findUserById(userId);
      if (userDocument) {
        const jwt = await tokenService.createJWT({
          user: userDocument,
          clientId,
          scope
        });
        if (jwt) {
          authorizationcodeService.deleteAuthourizationCodeDocumentById(code);
          return resp.status(200).json(jwt);
        }
      }
    }
    log.info(
      `${funcName}: either user is not authenticated or user not found, returning error for token endpoint`
    );
    return resp.status(403).json({
      error: "unauthorized",
      error_message: "Invalid authorization code"
    });
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generating token reponse with error: ${error}`
    );
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

export default {
  token
};
