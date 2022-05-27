import mongoose, { Schema } from "mongoose";

import {
  FindByClientIdState,
  StateDocument,
  UpdateStateDocument
} from "../types/StateModel";
import constants from "../utils/constants";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";

const StateSchema = new Schema(
  {
    clientId: { type: String, required: true },
    state: { type: String, required: true },
    createdAt: {
      type: Date,
      expires: `${process.env.STATE_EXPIRTY_IN_SECONDS || 86400}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    expireAfterSeconds: Number(process.env.STATE_EXPIRTY_IN_SECONDS || 86400)
  }
);

StateSchema.statics.parseStateDocument = (stateDocument: StateDocument) => {
  const funcName = `StateSchema.statics.parseStateDocument`;
  try {
    if (stateDocument) {
      const decryptedState = decrypt(
        stateDocument.state,
        process.env.STATE_ENCRYPTION_KEY || "",
        "base64"
      );
      stateDocument.state = decryptedState;
      return stateDocument;
    }
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while decrypting and parsing state with error ${error}`
    );
  }
  return stateDocument;
};

StateSchema.pre("save", async function (next) {
  this.state = encrypt(
    this.state,
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  next();
});

const StateModel = mongoose.model(
  "State",
  StateSchema,
  constants.COLlECTIONS.state
);

const createStateDocument = async (
  _state: StateDocument
): Promise<StateDocument> => {
  const funcName = createStateDocument.name;
  return StateModel.create(_state)
    .then(stateDocument => {
      const encryptedId = encrypt(
        stateDocument._id?.toString(),
        process.env.STATE_ENCRYPTION_KEY || "",
        "base64"
      );
      return {
        ...stateDocument,
        // _id: encodeURIComponent(encryptedId)
        _id: encryptedId
      };
    })
    .catch(err => {
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
    { $and: [{ clientId: _state.clientId }, { state: _state.state }] },
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
  return StateModel.findOne(_state)
    .then(stateDocument => {
      if (stateDocument) return StateModel.parseStateDocument(stateDocument);
      return stateDocument;
    })
    .catch(err => {
      log.error(
        `${funcName}: Something went wrong while getting state document by state (${_state.state}) and client id${_state.clientId}  with error: ${err}`
      );
    });
};

const findStateById = async (_id: string): Promise<StateDocument> => {
  const funcName = findStateById.name;
  return StateModel.findOne({ _id: new mongoose.Types.ObjectId(_id) })
    .then(stateDocument => {
      if (stateDocument) return StateModel.parseStateDocument(stateDocument);
      return stateDocument;
    })
    .catch(err =>
      log.error(
        `${funcName}: Something went wrong while getting state document by id(${_id}) with error: ${err}`
      )
    );
};

const deleteStateById = async (_id: string): Promise<any> => {
  const funcName = deleteStateById.name;
  return StateModel.deleteOne({ _id: new mongoose.Types.ObjectId(_id) }).catch(
    err =>
      log.error(
        `${funcName}: Something went wrong while deleting state document by id(${_id}) with error: ${err}`
      )
  );
};

export default {
  findStateDocByStateValAndClientId,
  findStateById,
  updateStateDocumentById,
  updateStateDocument,
  createStateDocument,
  deleteStateById
};
