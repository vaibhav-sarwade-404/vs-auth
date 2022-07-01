import pageModel from "../model/page.model";
import { PageDocument, PageNames } from "../types/PagesModel";

const getHtmlForPage = async (page: PageNames): Promise<PageDocument> => {
  return pageModel.getHtmlForPage(page);
};

const updatePageHtml = async (
  page: PageNames,
  html: string
): Promise<PageDocument> => {
  return pageModel.updatePageHtml(page, html);
};

export default {
  getHtmlForPage,
  updatePageHtml
};
