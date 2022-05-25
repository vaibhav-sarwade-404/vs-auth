import stateModel from "../model/state.model";
import {
  FindByClientIdState,
  StateDocument,
  UpdateStateDocument
} from "../types/StateModel";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";
import cleanupService from "./cleanup.service";

const createStateDocument = async (state: StateDocument) => {
  return stateModel.createStateDocument(state);
};

const isValidState = async (state: FindByClientIdState) => {
  const funcName = isValidState.name;
  const stateId = decryptState(decodeURIComponent(state.state));
  const stateDocument = await stateModel.findStateById(stateId);
  let date = new Date();
  date.setDate(date.getDate() - 1);
  if (
    stateDocument &&
    stateDocument.isValid &&
    date > (stateDocument.updatedAt || new Date())
  ) {
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
      `${funcName}:, state is mark it for cleanup and update it as invalid`
    );
    return false;
  }
  return stateDocument && stateDocument.isValid;
};

const findStateById = async (id: string): Promise<StateDocument> => {
  return stateModel.findStateById(id);
};

const updateStateDocument = async (state: UpdateStateDocument) => {
  return stateModel.updateStateDocument(state);
};

const updateStateDocumentById = async (state: UpdateStateDocument) => {
  return stateModel.updateStateDocument(state);
};

const findStateByEncryptedState = async (state: FindByClientIdState) => {
  const stateId = decryptState(decodeURIComponent(state.state));
  return stateModel.findStateById(stateId);
};

const encryptState = (str: string): string => {
  const encryptedText = encrypt(
    str,
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  return encodeURIComponent(encryptedText);
};
const decryptState = (state: string): string => {
  const decryptedState = decrypt(
    state,
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  return decodeURIComponent(decryptedState);
};

const getEncryptedState = (state: string, clientId: string): string => {
  const encryptedText = encrypt(
    JSON.stringify({ state, clientId, date: Date.now() }),
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  return encodeURIComponent(encryptedText);
};

const getDecryptedState = async (state: FindByClientIdState) => {
  const funcName = getDecryptedState.name;
  try {
    const stateDocument = await findStateByEncryptedState(state);
    return stateDocument ? decryptState(stateDocument.state) : "";
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while fetching and decrypting state with error: ${error}`
    );
    return state.state;
  }
};

export default {
  createStateDocument,
  isValidState,
  findStateById,
  updateStateDocument,
  updateStateDocumentById,
  findStateByEncryptedState,
  encryptState,
  decryptState,
  getEncryptedState,
  getDecryptedState
};
