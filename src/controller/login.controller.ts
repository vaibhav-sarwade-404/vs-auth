import { Request, Response } from "express";
import fs from "fs";
import path from "path";

import { QueryParams } from "../types/AuthorizeModel.types";
import { toBase64 } from "../utils/crypto";

export const loginPageLoadController = (req: Request, res: Response) => {
  const {
    client_id: clientId = "",
    redirect_uri: callbackURL = "",
    state
  }: QueryParams = req.query;
  const loginFileContent = fs
    .readFileSync(path.join(__dirname, `../pages/login.html`))
    .toString();
  return res.status(200).send(
    loginFileContent.replace(
      "@@config@@",
      toBase64(
        JSON.stringify({
          clientId,
          callbackURL,
          state,
          _csrf: req.csrfToken()
        })
      )
    )
  );
};
