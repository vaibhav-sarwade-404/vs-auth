import { Request, Response } from "express";
import { JSDOM } from "jsdom";

import pageService from "../service/page.service";

export const errorPageLoadController = async (_req: Request, res: Response) => {
  const page = await pageService.getHtmlForPage("error");
  const dom = new JSDOM(page.html);
  return res.status(200).send(dom.serialize());
};
