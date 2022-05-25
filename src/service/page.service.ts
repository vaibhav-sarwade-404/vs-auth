import { getHtmlForPage as _getHtmlForPage } from "../model/page.model";
import { PageNames } from "../types/PagesModel";

const getHtmlForPage = async (page: PageNames) => {
  return _getHtmlForPage(page);
};

export default {
  getHtmlForPage
};
