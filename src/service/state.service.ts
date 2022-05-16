import {
  createStateDocument as _createStateDocument,
  isValidState as _isValidState
} from "../model/state.model";
import { FindByClientIdState, StateDocument } from "../types/StateModel.types";

const createStateDocument = async (state: StateDocument) => {
  return _createStateDocument(state);
};

const isValidState = async (state: FindByClientIdState) => {
  return _isValidState(state);
};

export default {
  createStateDocument,
  isValidState
};
