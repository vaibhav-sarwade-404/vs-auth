import usersModel from "../model/users.model";
import { BlockUserForIp, UsersDocument } from "../types/UsersModel";
import passwordService from "./password.service";

const createUserDocument = async (
  user: UsersDocument
): Promise<UsersDocument> => {
  const password = await passwordService.hashPassword(user.password);
  return usersModel.createUserDocument({
    ...user,
    password
  });
};

const updateUsersDocument = async (user: UsersDocument) => {
  return usersModel.updateUsersDocument(user);
};

const findUserById = async (id: string): Promise<UsersDocument> => {
  return usersModel.findUserById(id);
};

const findUserByEmail = async (email: string): Promise<UsersDocument> => {
  return usersModel.findUserByEmail(email);
};

const incrementLoginCountByUserId = async (
  id: string
): Promise<UsersDocument> => {
  return usersModel.incrementLoginCountByUserId(id);
};

const blockIpForUserById = async (
  blockUserForIpDocument: BlockUserForIp
): Promise<UsersDocument> => {
  return usersModel.blockIpForUserById(blockUserForIpDocument);
};

export default {
  createUserDocument,
  updateUsersDocument,
  findUserById,
  findUserByEmail,
  incrementLoginCountByUserId,
  blockIpForUserById
};
