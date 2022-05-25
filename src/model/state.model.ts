import mongoose, { Schema } from "mongoose";

import {
  FindByClientIdState,
  StateDocument,
  UpdateStateDocument
} from "../types/StateModel";
import constants from "../utils/constants";
import log from "../utils/logger";

const stateExpirtyInSeconds = Number(
  process.env.STATE_EXPIRTY_IN_SECONDS || 3600
);
const StateSchema = new Schema(
  {
    clientId: { type: String, required: true },
    state: { type: String, required: true },
    isValid: { type: Boolean, required: true }
  },
  { timestamps: true, expireAfterSeconds: stateExpirtyInSeconds }
);
const StateModel = mongoose.model(
  "State",
  StateSchema,
  constants.COLlECTIONS.state
);

const createStateDocument = async (
  _state: StateDocument
): Promise<StateDocument> => {
  const funcName = createStateDocument.name;
  return StateModel.create(_state).catch(err => {
    log.error(
      `${funcName}: Something went wrong while creating state document with error: ${err}`
    );
  });
};

const updateStateDocument = async (
  _state: UpdateStateDocument
): Promise<any> => {
  const funcName = updateStateDocument.name;
  return StateModel.updateOne(
    { $and: [{ clienId: _state.clientId }, { state: _state.state }] },
    { _state },
    { upsert: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update state document with error: ${err}`
    );
  });
};

const updateStateDocumentById = async (
  _state: UpdateStateDocument
): Promise<any> => {
  const funcName = updateStateDocument.name;
  return StateModel.updateOne(
    { _id: _state._id },
    { _state },
    { upsert: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update state document by id(${_state._id}) with error: ${err}`
    );
  });
};

const findStateDocByStateValAndClientId = async (
  _state: FindByClientIdState
): Promise<StateDocument> => {
  const funcName = findStateDocByStateValAndClientId.name;
  return StateModel.findOne(_state).catch(err => {
    log.error(
      `${funcName}: Something went wrong while getting state document by state (${_state.state}) and client id${_state.clientId}  with error: ${err}`
    );
  });
};

const findStateById = async (_id: string): Promise<StateDocument> => {
  const funcName = findStateById.name;
  return StateModel.findOne({ _id: new mongoose.Types.ObjectId(_id) }).catch(
    err =>
      log.error(
        `${funcName}: Something went wrong while getting state document by id(${_id}) with error: ${err}`
      )
  );
};

export default {
  findStateDocByStateValAndClientId,
  findStateById,
  updateStateDocumentById,
  updateStateDocument,
  createStateDocument
};
