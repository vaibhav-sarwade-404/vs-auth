import stateService from "../model/state.model";
import {
  FindByClientIdState,
  StateDocument,
  UpdateStateDocument
} from "../types/StateModel.types";
import log from "../utils/logger";
import cleanupService from "./cleanup.service";

const createStateDocument = async (state: StateDocument) => {
  return stateService.createStateDocument(state);
};

const isValidState = async (state: FindByClientIdState) => {
  const funcName = isValidState.name;
  const stateDocument = await stateService.findStateDocByStateValAndClientId(
    state
  );
  let date = new Date();
  date.setDate(date.getDate() - 1);
  if (stateDocument.isValid && date > (stateDocument.updatedAt || new Date())) {
    updateStateDocumentById({
      ...state,
      isValid: false
    });
    cleanupService.createCleanupDocument({
      id: stateDocument._id?.toString() || "",
      collectionName: "state",
      error: "",
      cleaned: false
    });
    log.info(
      `${funcName}, state is mark it for cleanup and update it as invalid`
    );
    return false;
  }
  return stateDocument.isValid || false;
};

const findStateById = async (id: string) => {
  return stateService.findStateById(id);
};

const updateStateDocument = async (state: UpdateStateDocument) => {
  return stateService.updateStateDocument(state);
};

const updateStateDocumentById = async (state: UpdateStateDocument) => {
  return stateService.updateStateDocument(state);
};

export default {
  createStateDocument,
  isValidState,
  findStateById,
  updateStateDocument,
  updateStateDocumentById
};
