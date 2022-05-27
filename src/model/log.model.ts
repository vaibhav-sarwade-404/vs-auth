import mongoose, { Schema } from "mongoose";
import { LogDocument } from "../types/LogModel";

import constants from "../utils/constants";
import log from "../utils/logger";

const LogSchema = new Schema(
  {
    type: { type: String, required: true },
    client_id: { type: String },
    client_name: { type: String },
    ip: { type: String, required: true },
    user_agent: { type: String, required: true },
    user_id: { type: String },
    decription: { type: String, required: true },
    email: { type: String },
    createdAt: {
      type: Date,
      expires: `30d`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    expireAfterSeconds: 2592000
  }
);

const LogModel = mongoose.model("Log", LogSchema, constants.COLlECTIONS.logs);

const createLogDocument = async (
  logDocument: LogDocument
): Promise<LogDocument> => {
  const funcName = createLogDocument.name;
  return LogModel.create(logDocument).catch(error =>
    log.error(
      `${funcName}: something went wrong while saving log document ${JSON.stringify(
        logDocument
      )} with error: ${error}`
    )
  );
};

export default { createLogDocument };
