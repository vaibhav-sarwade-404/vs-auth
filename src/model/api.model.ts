import mongoose, { Schema } from "mongoose";
import { ApisDocument } from "../types/ApisModel";

import constants from "../utils/constants";
import { Logger } from "../utils/logger";

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
  const log = new Logger(findApiByIdentifier.name);
  log.debug(`looking up APIs document with identifier (${identifier})`);
  return ApiModel.findOne({ identifier }).catch(error =>
    log.error(
      `Somethine went wrong while getting API by identifier ${identifier} with error : ${error}`
    )
  );
};

const findByApiId = async (id: string): Promise<ApisDocument> => {
  const log = new Logger(findByApiId.name);
  log.debug(`looking up APIs document with id (${id})`);
  return ApiModel.findOne({ _id: new mongoose.Types.ObjectId(id) }).catch(
    error =>
      log.error(
        `Somethine went wrong while getting API by identifier ${id} with error : ${error}`
      )
  );
};

export default {
  findApiByIdentifier,
  findByApiId
};
