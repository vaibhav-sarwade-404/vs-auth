import mongoose, { Schema } from "mongoose";
import { FindByClientIdState, StateDocument } from "../types/StateModel.types";
import constants from "../utils/constants";
import log from "../utils/logger";

const StateSchema = new Schema(
  {
    clientId: { type: String, required: true },
    state: { type: String, required: true },
    isValid: { type: Boolean, required: true }
  },
  { timestamps: true }
);
const StateModel = mongoose.model(
  "State",
  StateSchema,
  constants.COLlECTIONS.state
);

export const createStateDocument = async (
  _state: StateDocument
): Promise<StateDocument> => {
  const funcName = createStateDocument.name;
  return StateModel.create(_state).catch(err => {
    log.error(
      `${funcName}: Something went wrong while creating state document with error: ${err}`
    );
  });
};

export const updateStateDocument = async (
  _state: StateDocument
): Promise<any> => {
  const funcName = updateStateDocument.name;
  return StateModel.updateOne(
    { $and: [{ clienId: _state.clientId }, { state: _state.state }] },
    {},
    { upsert: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update state document with error: ${err}`
    );
  });
};

const getStateDocByStateValAndClientId = async (
  _state: FindByClientIdState
): Promise<StateDocument> => {
  const funcName = getStateDocByStateValAndClientId.name;
  return StateModel.findOne(_state).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update state document with error: ${err}`
    );
  });
};

export const isValidState = async (
  _state: FindByClientIdState
): Promise<boolean> => {
  const state = (await getStateDocByStateValAndClientId(_state)) || {};
  return state.isValid || false;
};
