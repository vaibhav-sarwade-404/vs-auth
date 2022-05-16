import mongoose, { Schema } from "mongoose";
import { CleanupDocument } from "../types/CleanupModel.types";

import constants from "../utils/constants";
import log from "../utils/logger";

const CleanupSchema = new Schema(
  {
    collectionName: { type: String, required: true },
    id: { type: String, required: true },
    cleaned: { type: Boolean, required: true },
    error: { type: String }
  },
  { timestamps: true }
);
const CleanupModel = mongoose.model(
  "Cleanup",
  CleanupSchema,
  constants.COLlECTIONS.state
);

export const createCleanupDocument = async (
  _cleanupDoc: CleanupDocument
): Promise<CleanupDocument> => {
  const funcName = createCleanupDocument.name;
  return CleanupModel.create(_cleanupDoc).catch(err => {
    log.error(
      `${funcName}: Something went wrong while creating cleanup document with error: ${err}`
    );
  });
};

export const updateCleanupDocument = async (
  _cleanupDoc: CleanupDocument
): Promise<any> => {
  const funcName = updateCleanupDocument.name;
  return CleanupModel.updateOne(
    { id: _cleanupDoc.id },
    { _cleanupDoc },
    { upsert: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update cleanup document with error: ${err}`
    );
  });
};

export const getDocumentsToClean = async (): Promise<
  [CleanupDocument] | any
> => {
  const funcName = getDocumentsToClean.name;
  return CleanupModel.find({ isCleaned: false }, {}, { limit: 20 }).catch(
    err => {
      log.error(
        `${funcName}: Something went wrong while fetching cleanup documents for cleanup with error: ${err}`
      );
    }
  );
};
