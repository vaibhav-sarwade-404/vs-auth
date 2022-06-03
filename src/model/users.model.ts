import mongoose, { Schema } from "mongoose";

import {
  BlockUserForIp,
  UpdateUserDocument,
  UsersDocument
} from "../types/UsersModel";
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
    user_metadata: { type: MetaDataSchema },
    login_count: { type: Number },
    blocked_for: { type: [String] }
  },
  { timestamps: true }
);

UsersSchema.statics.santitizeUserForResponse = (user: UsersDocument) => {
  return {
    email: user.email,
    user_metadata: user.user_metadata,
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
): Promise<UsersDocument> => {
  const funcName = createUserDocument.name;
  return UsersModel.create(user)
    .then(_user => {
      if (_user) return UsersModel.santitizeUserForResponse(_user);
      return _user;
    })
    .catch(err => {
      log.error(
        `${funcName}: Something went wrong while creating user document with error: ${err}`
      );
    });
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

export const findUserById = async (_id: string): Promise<UsersDocument> => {
  const funcName = findUserById.name;
  return UsersModel.findOne({ _id }).catch(err =>
    log.error(
      `${funcName}: Something went wrong while geting user with id(${_id}) document with error: ${err}`
    )
  );
};

export const findUserByEmail = async (
  email: string
): Promise<UsersDocument> => {
  const funcName = findUserById.name;
  return UsersModel.findOne({ email }).catch(err =>
    log.error(
      `${funcName}: Something went wrong while get user with email(${email}) document with error: ${err}`
    )
  );
};

export const incrementLoginCountByUserId = async (
  id: string
): Promise<UsersDocument> => {
  const funcName = incrementLoginCountByUserId.name;
  return UsersModel.findOneAndUpdate(
    { _id: id },
    { $inc: { login_count: 1 } },
    { upsert: false }
  ).catch(err =>
    log.error(
      `${funcName}: Something went wrong while incrementing login count for user with id(${id}) with error: ${err}`
    )
  );
};

export const blockIpForUserById = async (
  blockIpDocument: BlockUserForIp
): Promise<UsersDocument> => {
  const funcName = incrementLoginCountByUserId.name;
  return UsersModel.findOneAndUpdate(
    { _id: blockIpDocument._id },
    { $addToSet: { blocked_for: blockIpDocument.ip } },
    { upsert: false }
  ).catch(err =>
    log.error(
      `${funcName}: Something went wrong while updating blocked ip for user with id(${blockIpDocument._id}) with error: ${err}`
    )
  );
};

export default {
  createUserDocument,
  updateUsersDocument,
  findUserById,
  findUserByEmail,
  incrementLoginCountByUserId,
  blockIpForUserById
};
