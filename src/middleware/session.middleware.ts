import { Request, Response, NextFunction } from "express";

import authorizationcodeService from "../service/authorizationcode.service";
import logService from "../service/log.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";
import log from "../utils/logger";

export default async (req: Request, resp: Response, next: NextFunction) => {
  const funcName = "session.middleware";
  const {
    client_id: clientId = "",
    redirect_uri: callbackURL,
    code_challenge: codeChallenge = "",
    code_challenge_method: codeChallengeMethod = "",
    response_type = "code",
    state = "",
    scope = ""
  }: QueryParams = req.query;
  try {
    const clientIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const {
      clientId: sessionClientId,
      clientIp: sessionClientIp,
      userId = "",
      isAuthenticated = false
    } = req.session.user || {};
    if (sessionClientId && clientIp && isAuthenticated) {
      if (clientId === sessionClientId && clientIp === sessionClientIp) {
        if (response_type === "code") {
          let formattedCallbackURL = new URL(callbackURL || "");
          const authorizationCodeDocument =
            await authorizationcodeService.createAuthourizationCodeDocument({
              userId,
              clientId,
              codeChallenge,
              codeChallengeMethod,
              callbackURL: callbackURL || "",
              scope
            });
          formattedCallbackURL.searchParams.set(
            "code",
            authorizationCodeDocument.code || ""
          );
          formattedCallbackURL.searchParams.set("state", state);
          log.info(`session is valid for user, redirecting to callback`);
          if (req.logDocument) {
            req.logDocument = {
              ...req.logDocument,
              type: "success_code_exchange",
              decription:
                "Authorization code is successfully exchanged with tokens",
              client_id: clientId,
              user_id: userId
            };
            logService.createLogEvent(req.logDocument);
          }
          return resp.redirect(formattedCallbackURL.href);
        }
        //TO-DO: Other reponse types
      }
    }
    next();
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while retriving session to check authentication with error: ${error}`
    );
    return resp
      .status(302)
      .redirect(
        `/error/?client_id=${clientId}&state=${state}&error=unauthorized&error_description=${encodeURIComponent(
          "Authorization error while retriving session"
        )}`
      );
  }
};
