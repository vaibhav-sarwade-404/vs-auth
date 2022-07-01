import usersModel from "../model/users.model";
import {
  BlockUserForIp,
  UpdateUserDocument,
  UserDocument
} from "../types/UsersModel";
import passwordService from "./password.service";
import { Logger } from "../utils/logger";
import emailService from "./email.service";
import { ClientDocument } from "../types/AuthorizeRedirectModel";
import ticketService from "./ticket.service";
import logService from "./log.service";
import { LogDocument } from "../types/LogModel";
import { TicketDocument } from "../types/TicketModel";
import HttpException from "../model/HttpException";
import urlUtils from "../utils/urlUtils";
import { EmailDocument } from "../types/EmailModel";
import loginRateLimitService from "./loginRateLimit.service";
import constants from "../utils/constants";
import RequestValidationError from "../model/RequestValidationError.Model";

const fileName = `users.service`;

const createUserDocument = async (
  user: UserDocument
): Promise<UserDocument> => {
  const password = await passwordService.hashPassword(user.password);
  return usersModel.createUserDocument({
    ...user,
    password
  });
};

const updateUsersDocument = async (user: UpdateUserDocument) => {
  return usersModel.updateUsersDocument(user);
};

const findUserById = async (id: string): Promise<UserDocument> => {
  return usersModel.findUserById(id);
};

const findUserByEmail = async (email: string): Promise<UserDocument> => {
  return usersModel.findUserByEmail(email);
};

const incrementLoginCountByUserId = async (
  id: string
): Promise<UserDocument> => {
  return usersModel.incrementLoginCountByUserId(id);
};

const blockIpForUserById = async (
  blockUserForIpDocument: BlockUserForIp,
  clientDocument?: ClientDocument,
  logDocument?: LogDocument
): Promise<UserDocument> => {
  const userDocument = await usersModel.blockIpForUserById(
    blockUserForIpDocument
  );
  await emailService.sendUserEmail(
    "BLOCKED_ACCOUNT_EMAIL",
    userDocument,
    clientDocument,
    logDocument
  );
  return userDocument;
};

const forgotPassword = async (
  email: string,
  clientDocument?: ClientDocument,
  logDocument?: LogDocument
): Promise<UserDocument | undefined> => {
  const logger = new Logger(`${fileName}.${forgotPassword.name}`);
  const user = await findUserByEmail(email);
  if (!user) {
    logger.error(`User with email(${email}) not found for forgot password`);
    return;
  }
  if (user) {
    await emailService
      .sendUserEmail("PASSWORD_RESET_EMAIL", user, clientDocument, logDocument)
      .then(() => {});
    return user;
  }
};

const validateAndGetNewPasswordHistory = async (
  passwordHistory: string[],
  currentPassword: string,
  newPassword: string
) => {
  passwordHistory = [...passwordHistory, currentPassword];
  const isHistoryPassword = passwordHistory.find((oldPassword: string) =>
    passwordService.comparePassword(newPassword, oldPassword)
  );
  if (isHistoryPassword) {
    throw new HttpException(
      400,
      "PasswordHistory",
      "Password has previously been used. You may not reuse any of the last 3 passwords."
    );
  }
  passwordHistory.length > 2 && passwordHistory.shift();
  return passwordHistory;
};

const changePassword = async (
  newPassword: string,
  ticket: string,
  ticketDocument: TicketDocument,
  logDocument: LogDocument
): Promise<string | undefined> => {
  const logger = new Logger(`${fileName}.${changePassword.name}`);
  const user = await findUserById(ticketDocument.userId);
  if (!user) {
    return;
  }
  user.passwordHistory = await validateAndGetNewPasswordHistory(
    [...user.passwordHistory],
    user.password,
    newPassword
  );
  const newPasswordHash = await passwordService.hashPassword(newPassword);
  const updateResult = await updateUsersDocument({
    password: newPasswordHash,
    email: user.email,
    email_verified: user.email_verified || true,
    passwordHistory: user.passwordHistory
  });
  if (!updateResult || (updateResult && !updateResult.acknowledged)) {
    logger.error(
      `something went wrong while updating password, updateResult is not ok`
    );
    throw new HttpException(500, "generic_error", "Something went wrong");
  }
  const emailDocument = await emailService.getEmailDocument(
    ticketDocument.ticketContext.type
  );
  await ticketService.findAndDeleteTicketById(ticket);
  if (emailDocument) {
    const redirect_url = urlUtils.createUrlWithHash(emailDocument.redirectTo, {
      success: true,
      description: "Sucessfully updated password"
    });
    await logService.createLogEvent({
      ...logDocument,
      client_id: ticketDocument.clientInformation.clientId,
      client_name: ticketDocument.clientInformation.clientName,
      email: user.email,
      type: "success_change_password_request",
      decription: "Password reset email send successfully"
    });
    return redirect_url;
  }
  logger.info(
    `operation was successful but coulnd't get email document for redirect URL, so return #`
  );
  return "#";
};

const processActionForEmail = async (
  ticketDocument: TicketDocument,
  emailDocument: EmailDocument
): Promise<string> => {
  const logger = new Logger(`${fileName}.${processActionForEmail.name}`);
  const {
    userId,
    ticketContext: { type, ip }
  } = ticketDocument;
  logger.info(
    `procession email action for email ${type} for user with id(${userId})`
  );

  const userDocument = await findUserById(userId);
  if (!userDocument) {
    logger.error(
      `user with user id(${userId}) not found, process email action`
    );
    return "#";
  }
  let successDescription = "Email verified successfully";
  if (type === "BLOCKED_ACCOUNT_EMAIL") {
    userDocument.blocked_for = (userDocument.blocked_for || [""]).filter(
      blockedIp => blockedIp !== ip
    );
    successDescription = "Account is unblocked";
  }
  const updateResult = await updateUsersDocument({
    email: userDocument.email,
    email_verified: userDocument.email_verified || true,
    blocked_for: userDocument.blocked_for,
    password: userDocument.password,
    passwordHistory: userDocument.passwordHistory
  });
  if (!updateResult || (updateResult && !updateResult.acknowledged)) {
    logger.error(
      `something went wrong while verifying users email for user (${userId}) updateResult is not ok`
    );
    throw new HttpException(500, "generic_error", "Something went wrong");
  }

  if (type === "BLOCKED_ACCOUNT_EMAIL") {
    logger.info(
      `clearing rate limit for user(${userDocument.email}) for ip ${ip}`
    );
    await loginRateLimitService.deleteDocumentByKey(
      `${constants.RATE_LIMIT_KEYS.failedEmailPasswordLogin}${
        userDocument.email
      }_${ip.toString()}`
    );
  }

  logger.info(`clearing ticket for user(${userDocument.email}) for ip ${ip}`);
  await ticketService.findAnddeleteTicketByOriginalId(
    ticketDocument._id?.toString() || ""
  );
  const redirect_url = urlUtils.createUrlWithHash(emailDocument.redirectTo, {
    success: true,
    description: successDescription
  });
  return redirect_url || "#";
};

const getUser = async (userId: string): Promise<UserDocument> => {
  return usersModel.getUser(userId);
};

const updateUserByUserId = async (
  user: UpdateUserDocument
): Promise<UserDocument> => {
  if (user.password) {
    const _user = await getUser(user._id || "");
    if (!_user) {
      const validationError = new RequestValidationError();
      validationError.addError = {
        field: "userId",
        error: `userId is invalid`
      };
      throw validationError;
    }
    user.passwordHistory = await validateAndGetNewPasswordHistory(
      [..._user.passwordHistory],
      _user.password,
      user.password
    );
    user.password = await passwordService.hashPassword(user.password);
  }
  return usersModel.updateUserByUserId(user);
};

const deleteUser = async (userId: string) => {
  return usersModel.deleteUser(userId);
};

export default {
  createUserDocument,
  updateUsersDocument,
  findUserById,
  findUserByEmail,
  incrementLoginCountByUserId,
  blockIpForUserById,
  forgotPassword,
  changePassword,
  processActionForEmail,
  getUser,
  updateUserByUserId,
  deleteUser
};
