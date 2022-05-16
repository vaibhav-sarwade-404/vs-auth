import mongoose, { Schema } from "mongoose";

import constants from "../utils/constants";
import log from "../utils/logger";
import { PageDocument, PageNames } from "../types/PagesModel.types";

const PageSchema = new Schema(
  {
    page: { type: String, required: true },
    html: { type: String, required: true }
  },
  { timestamps: true }
);

const PageModel = mongoose.model(
  "Page",
  PageSchema,
  constants.COLlECTIONS.pages
);

export const getHtmlForPage = async (
  page: PageNames
): Promise<PageDocument> => {
  const funcName = getHtmlForPage.name;
  return PageModel.findOne({ page }, { html: 1 }).catch(error => {
    log.error(
      `${funcName}: Something went wrong while fetching HTML for page: ${page} with error ${error}`
    );
  });
};
