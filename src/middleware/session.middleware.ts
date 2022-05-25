import { Request, Response, NextFunction } from "express";

import authorizationcodeService from "../service/authorizationcode.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";
import log from "../utils/logger";

export default async (req: Request, resp: Response, next: NextFunction) => {
  const funcName = "session.middleware";
  const {
    client_id: clientId = "",
    redirect_uri: callbackURL,
    code_challenge: codeChallenge = "",
    code_challenge_method: codeChallengeMethod = "",
    state = ""
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
        let formattedCallbackURL = new URL(callbackURL || "");
        const authorizationCodeDocument =
          await authorizationcodeService.createAuthourizationCodeDocument(
            JSON.stringify({
              userId,
              clientId,
              codeChallenge,
              codeChallengeMethod
            })
          );
        formattedCallbackURL.searchParams.set(
          "code",
          authorizationCodeDocument.id
        );
        formattedCallbackURL.searchParams.set("state", state);
        log.info(`session is valid for user, redirecting to callback`);
        return resp.redirect(formattedCallbackURL.href);
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
