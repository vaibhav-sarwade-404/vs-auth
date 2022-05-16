import { Request, Response } from "express";

import domService from "../service/dom.service";
import pageService from "../service/page.service";
import { QueryParams } from "../types/AuthorizeModel.types";

export const loginPageLoadController = async (req: Request, res: Response) => {
  const {
    client_id: clientId = "",
    redirect_uri: callbackURL = "",
    state = ""
  }: QueryParams = req.query;
  const page = (await pageService.getHtmlForPage("login")) || "";
  const stringifiedDom = domService.parseDocAndInjectDataConfig(page, {
    clientId,
    callbackURL,
    state,
    _csrf: req.csrfToken()
  });
  return res.status(200).send(stringifiedDom);
};
