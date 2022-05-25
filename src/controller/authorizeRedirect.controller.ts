import { Request, Response } from "express";
import QueryString from "qs";
import uid from "uid-safe";

import { QueryParams } from "../types/AuthorizeRedirectModel";
import stateService from "../service/state.service";
import log from "../utils/logger";

export const handleAuthorizeRequest = async (req: Request, resp: Response) => {
  const _defaultState = uid.sync(20);
  const { state = _defaultState, client_id: clientId = "" }: QueryParams =
    req.query;
  const encryptedState = stateService.encryptState(state);
  let returnState = encryptedState;
  if (state) {
    const stateDocument = await stateService.createStateDocument({
      clientId,
      state: encryptedState,
      isValid: true
    });
    returnState = stateService.encryptState(
      stateDocument._id?.toString() || ""
    );
  }
  log.info(
    `handleAuthorize: /authorize request is valid, redirecting to /login endpoint`
  );

  req.session.user = {
    clientId,
    clientIp: req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""
  };
  return resp
    .status(302)
    .redirect(
      `/login/?${QueryString.stringify(
        { ...req.query, state: returnState } || {}
      )}`
    );
};
