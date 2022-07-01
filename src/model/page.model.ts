import mongoose, { Schema } from "mongoose";

import constants from "../utils/constants";
import log, { Logger } from "../utils/logger";
import { PageDocument, PageNames } from "../types/PagesModel";

const fileName = `page.model`;

const PageSchema = new Schema(
  {
    page: { type: String, required: true, index: true, unique: true },
    html: { type: String, required: true }
  },
  { timestamps: true }
);

const PageModel = mongoose.model(
  "Page",
  PageSchema,
  constants.COLlECTIONS.pages
);

const getHtmlForPage = async (page: PageNames): Promise<PageDocument> => {
  const log = new Logger(`${fileName}.${getHtmlForPage.name}`);
  return PageModel.findOne({ page }, { html: 1 }).catch(error => {
    log.error(
      `Something went wrong while fetching HTML for page: ${page} with error ${error}`
    );
  });
};

const updatePageHtml = async (
  page: PageNames,
  html: string
): Promise<PageDocument> => {
  const log = new Logger(`${fileName}.${updatePageHtml.name}`);
  return PageModel.findOneAndUpdate({ page }, { html }).catch(error => {
    log.error(
      `Something went wrong while updating HTML for page: ${page} with error ${error}`
    );
  });
};

export default {
  getHtmlForPage,
  updatePageHtml
};
