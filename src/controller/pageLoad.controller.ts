import { Request, Response } from "express";

import domService from "../service/dom.service";
import pageService from "../service/page.service";
import { QueryParams } from "../types/AuthorizeRedirectModel";

const login = async (req: Request, res: Response) => {
  const {
    client_id: clientId = "",
    redirect_uri: callbackURL = "",
    state = "",
    response_type = "code",
    scope = "openid profile email"
  }: QueryParams = req.query;
  const page = (await pageService.getHtmlForPage("login")) || "";
  const stringifiedDom = domService.parseDocAndInjectDataConfig(page, {
    clientId,
    callbackURL,
    state,
    responseType: response_type,
    scope,
    _csrf: req.csrfToken()
  });
  return res.status(200).send(stringifiedDom);
};

const passwordReset = async (req: Request, res: Response) => {
  const page = (await pageService.getHtmlForPage("password_reset")) || "";
  const stringifiedDom = domService.parseDocAndInjectDataConfig(page, {
    _csrf: req.csrfToken()
  });
  return res.status(200).send(stringifiedDom);
};

export default { login, passwordReset };
