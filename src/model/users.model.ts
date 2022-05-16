import mongoose, { Schema } from "mongoose";

import { StateDocument, UpdateStateDocument } from "../types/StateModel.types";
import { UpdateUserDocument, UsersDocument } from "../types/UsersModel.types";
import constants from "../utils/constants";
import log from "../utils/logger";

const MetaDataSchema = new Schema({
  firstName: { type: String },
  lastName: { type: String }
});

const UsersSchema = new Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    user_metadata: { type: MetaDataSchema }
  },
  { timestamps: true }
);

UsersSchema.statics.santitizeUserForResponse = (user: UsersDocument) => {
  return {
    email: user.email,
    meta_data: user.meta_data,
    id: (user._id || "").toString()
  };
};

const UsersModel = mongoose.model(
  "Users",
  UsersSchema,
  constants.COLlECTIONS.users
);

export const createUserDocument = async (
  user: UsersDocument
): Promise<StateDocument> => {
  const funcName = createUserDocument.name;
  return UsersModel.create(user)
    .catch(err => {
      log.error(
        `${funcName}: Something went wrong while creating user document with error: ${err}`
      );
    })
    .then(user => UsersModel.santitizeUserForResponse(user));
};

export const updateUsersDocument = async (
  user: UpdateUserDocument
): Promise<any> => {
  const funcName = updateUsersDocument.name;
  return UsersModel.updateOne(
    { $and: [{ email: user.email }] },
    { user },
    { upsert: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update user document with error: ${err}`
    );
  });
};

export const updateStateDocumentById = async (
  user: UpdateStateDocument
): Promise<any> => {
  const funcName = updateUsersDocument.name;
  return UsersModel.updateOne(
    { _id: user._id },
    { user },
    { upsert: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update user document by id(${user._id}) with error: ${err}`
    );
  });
};

export const findUserById = async (_id: string) => {
  const funcName = findUserById.name;
  return UsersModel.findOne({ _id }).catch(err =>
    log.error(
      `${funcName}: Something went wrong while geting user with id(${_id}) document with error: ${err}`
    )
  );
};

export const findUserByEmail = async (email: string) => {
  const funcName = findUserById.name;
  return UsersModel.findOne({ email }).catch(err =>
    log.error(
      `${funcName}: Something went wrong while ser with email(${email}) document with error: ${err}`
    )
  );
};

export default {
  createUserDocument,
  updateUsersDocument,
  updateStateDocumentById,
  findUserById,
  findUserByEmail
};
