import mongoose, { Schema } from "mongoose";
import { ApisDocument } from "../types/ApisModel";

import constants from "../utils/constants";
import log from "../utils/logger";

const ApiSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    identifier: { type: String, required: true, unique: true, index: true },
    tokenExpiry: { type: Number, required: true },
    tokenSigningAlgo: { type: String, required: true },
    permissions: { type: [String], required: false }
  },
  { timestamps: true }
);

const ApiModel = mongoose.model("APIs", ApiSchema, constants.COLlECTIONS.apis);

const findApiByIdentifier = async (
  identifier: string
): Promise<ApisDocument> => {
  const funcName = `api.model.${findApiByIdentifier.name}`;
  log.debug(
    `${funcName}: looking up APIs document with identifier (${identifier})`
  );
  return ApiModel.findOne({ identifier }).catch(error =>
    log.error(
      `${funcName}: Somethine went wrong while getting API by identifier ${identifier} with error : ${error}`
    )
  );
};

export default {
  findApiByIdentifier
};
