import usersModel from "../model/users.model";
import { UsersDocument } from "../types/UsersModel.types";
import passwordService from "./password.service";

const createUserDocument = async (user: UsersDocument) => {
  const password = await passwordService.hashPassword(user.password);
  return usersModel.createUserDocument({
    ...user,
    password
  });
};

const updateUsersDocument = async (user: UsersDocument) => {
  return usersModel.updateUsersDocument(user);
};

const updateStateDocumentById = async (user: UsersDocument) => {
  return usersModel.updateStateDocumentById(user);
};

const findUserById = async (id: string) => {
  return usersModel.findUserById(id);
};
const findUserByEmail = async (email: string) => {
  return usersModel.findUserByEmail(email);
};

export default {
  createUserDocument,
  updateUsersDocument,
  updateStateDocumentById,
  findUserById,
  findUserByEmail
};
