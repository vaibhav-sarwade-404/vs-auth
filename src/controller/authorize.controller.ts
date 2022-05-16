import { Request, Response } from "express";
import QueryString from "qs";
import uid from "uid-safe";

import { QueryParams } from "../types/AuthorizeModel.types";
import authorizeService from "../service/authorize.service";
import stateService from "../service/state.service";
import log from "../utils/logger";

export const handleAuthorize = async (req: Request, res: Response) => {
  const _defaultState = uid.sync(20);
  const { state = _defaultState, client_id: clientId = "" }: QueryParams =
    req.query;
  const encryptedState = await authorizeService.getEncryptedState(
    state,
    clientId
  );
  let stateDocument = {
    clientId,
    state: encryptedState,
    isValid: true
  };
  if (state) {
    stateDocument = await stateService.createStateDocument(stateDocument);
  }
  log.info(
    `handleAuthorize: /authorize request is valid, redirecting to /login endpoint`
  );
  return res
    .status(302)
    .redirect(
      `/login/?${QueryString.stringify(
        { ...req.query, state: stateDocument.state } || {}
      )}`
    );
};
