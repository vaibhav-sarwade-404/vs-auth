import { NextFunction, Request, Response } from "express";
import HttpException from "../model/HttpException";
import pageService from "../service/page.service";
import { PagesHtmlUpdateRequest } from "../types/Request";

import { Logger } from "../utils/logger";

const fileName = `pages.controller`;

const updatePage = async (req: Request, resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${updatePage.name}`);
  const { page, html }: PagesHtmlUpdateRequest = req.body;
  try {
    const pageDocument = await pageService.updatePageHtml(page, html);
    if (!pageDocument) {
      next(new HttpException(500, "Something went wrong"));
    }
    return resp.status(200).send();
  } catch (error) {
    logger.error(
      `Something went wrong while updating page(${page}) with error:${error}`
    );
    next(new HttpException(500, "Something went wrong"));
  }
};

export default {
  updatePage
};
