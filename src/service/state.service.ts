import stateModel from "../model/state.model";
import {
  FindByClientIdState,
  StateDocument,
  UpdateStateDocument
} from "../types/StateModel";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";

const createStateDocument = async (state: StateDocument) => {
  return stateModel.createStateDocument(state);
};

const isValidState = async (state: FindByClientIdState) => {
  // const stateId = decryptState(decodeURIComponent(state.id));
  const stateId = decryptState(state.id);
  const stateDocument = await stateModel.findStateById(stateId);
  return stateDocument && state.clientId === stateDocument.clientId;
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

const deleteStateDocumentById = async (id: string) =>
  stateModel.deleteStateById(id);

const findStateByEncryptedStateId = async (state: FindByClientIdState) => {
  // const stateId = decryptState(decodeURIComponent(state.id));
  const stateId = decryptState(state.id);
  return stateModel.findStateById(stateId);
};

const encryptState = (str: string): string => {
  const encryptedText = encrypt(
    str,
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  // return encodeURIComponent(encryptedText);
  return encryptedText;
};
const decryptState = (state: string): string => {
  const decryptedState = decrypt(
    state,
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  // return decodeURIComponent(decryptedState) || "";
  return decryptedState || "";
};

const getEncryptedState = (state: string, clientId: string): string => {
  const encryptedText = encrypt(
    JSON.stringify({ state, clientId, date: Date.now() }),
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  // return encodeURIComponent(encryptedText);
  return encryptedText;
};

const getDecryptedState = async (
  state: FindByClientIdState
): Promise<string> => {
  const funcName = getDecryptedState.name;
  try {
    const stateDocument = await findStateByEncryptedStateId(state);
    return stateDocument ? decryptState(stateDocument.state) : "";
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while fetching and decrypting state with error: ${error}`
    );
    return state.state || "";
  }
};

export default {
  createStateDocument,
  isValidState,
  findStateById,
  updateStateDocument,
  updateStateDocumentById,
  findStateByEncryptedStateId,
  encryptState,
  decryptState,
  getEncryptedState,
  getDecryptedState,
  deleteStateDocumentById
};
