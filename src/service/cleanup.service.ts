import {
  createCleanupDocument as _createCleanupDocument,
  updateCleanupDocument as _updateCleanupDocument,
  getDocumentsToClean as _getDocumentsToClean
} from "../model/cleanup.model";
import { CleanupDocument } from "../types/CleanupModel.types";
import constants from "../utils/constants";
import log from "../utils/logger";
import stateService from "./state.service";

const createCleanupDocument = async (_cleanupDoc: CleanupDocument) => {
  return _createCleanupDocument(_cleanupDoc);
};

const updateCleanupDocument = async (_cleanupDoc: CleanupDocument) => {
  return _updateCleanupDocument(_cleanupDoc);
};

const getDocumentsToClean = async () => _getDocumentsToClean();

const cleanDocuments = async () => {
  const funcName = cleanDocuments.name;
  try {
    const documentsToClean: [CleanupDocument] =
      (await getDocumentsToClean()) || [];
    if (documentsToClean.length) {
      documentsToClean.forEach(async documentToClean => {
        const { collection, id } = documentToClean;
        try {
          if (collection === constants.COLlECTIONS.state) {
            await stateService.updateStateDocumentById({
              _id: id,
              isValid: false
            });
          }
        } catch (error) {
          log.error(
            `${funcName}: Something went wrong while updating state document with _id (${id}) with error:${error}`
          );
        }
      });
    }
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while cleaning up documents with error:${error}`
    );
  }
};

export default {
  createCleanupDocument,
  updateCleanupDocument,
  getDocumentsToClean,
  cleanDocuments
};
