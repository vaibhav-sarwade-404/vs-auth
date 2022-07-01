import mongoose, { Schema } from "mongoose";
import { UpdateDocumemntResult } from "../types/MongoResult";

import {
  BlockUserForIp,
  UpdateUserDocument,
  UserDocument
} from "../types/UsersModel";
import constants from "../utils/constants";
import log, { Logger } from "../utils/logger";

const fileName = "users.model";

const MetaDataSchema = new Schema({
  firstName: { type: String },
  lastName: { type: String }
});

const UsersSchema = new Schema(
  {
    email: { type: String, required: true },
    email_verified: { type: Boolean, required: true },
    password: { type: String, required: true },
    passwordHistory: { type: [String], default: [] },
    user_metadata: { type: MetaDataSchema },
    login_count: { type: Number },
    blocked_for: { type: [String] }
  },
  { timestamps: true }
);

UsersSchema.statics.santitizeUserForResponse = (user: UserDocument) => {
  const log = new Logger(
    `${fileName}.UsersSchema.statics.santitizeUserForResponse`
  );
  log.info(`Sanitizing user response`);
  return {
    email: user.email,
    email_verified: user.email_verified || false,
    user_metadata: user.user_metadata,
    id: (user._id || "").toString(),
    _id: (user._id || "").toString()
  };
};

const UsersModel = mongoose.model(
  "Users",
  UsersSchema,
  constants.COLlECTIONS.users
);

export const createUserDocument = async (
  user: UserDocument
): Promise<UserDocument> => {
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
): Promise<UpdateDocumemntResult | void> => {
  const funcName = updateUsersDocument.name;
  return UsersModel.updateOne(
    { $and: [{ email: user.email }] },
    { $set: { ...user } },
    { new: true }
  ).catch(err => {
    log.error(
      `${funcName}: Something went wrong while update user document with error: ${err}`
    );
  });
};

export const findUserById = async (_id: string): Promise<UserDocument> => {
  const funcName = findUserById.name;
  return UsersModel.findOne({ _id }).catch(err =>
    log.error(
      `${funcName}: Something went wrong while geting user with id(${_id}) document with error: ${err}`
    )
  );
};

export const findUserByEmail = async (email: string): Promise<UserDocument> => {
  const funcName = findUserById.name;
  return UsersModel.findOne({ email }).catch(err =>
    log.error(
      `${funcName}: Something went wrong while get user with email(${email}) document with error: ${err}`
    )
  );
};

export const incrementLoginCountByUserId = async (
  id: string
): Promise<UserDocument> => {
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
): Promise<UserDocument> => {
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

export const getUser = async (userId: string): Promise<UserDocument> => {
  const log = new Logger(getUser.name);
  return UsersModel.findOne({ _id: new mongoose.Types.ObjectId(userId) }).catch(
    err =>
      log.error(
        `Something went wrong while getting user with userId(${userId}) with error: ${err}`
      )
  );
};

export const updateUserByUserId = async (
  user: UpdateUserDocument
): Promise<UserDocument> => {
  const log = new Logger(updateUserByUserId.name);
  return UsersModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(user._id)
    },
    user,
    { new: true }
  )
    .then(_user => {
      if (_user) return UsersModel.santitizeUserForResponse(_user);
      return _user;
    })
    .catch(err =>
      log.error(
        `Something went wrong while updating user with userId(${user._id}) with error: ${err}`
      )
    );
};

export const deleteUser = async (userId: string): Promise<UserDocument> => {
  const log = new Logger(deleteUser.name);
  return UsersModel.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(userId)
  }).catch(err =>
    log.error(
      `Something went wrong while deleting user with userId(${userId}) with error: ${err}`
    )
  );
};

export default {
  createUserDocument,
  updateUsersDocument,
  findUserById,
  findUserByEmail,
  incrementLoginCountByUserId,
  blockIpForUserById,
  getUser,
  updateUserByUserId,
  deleteUser
};
