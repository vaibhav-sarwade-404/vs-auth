import bcrypt from "bcrypt";
import log from "../utils/logger";

const hashPassword = async (password: string): Promise<string> | never => {
  const funcName = hashPassword.name;
  try {
    const salt = bcrypt.genSaltSync(
      Number(process.env.PASSWORD_SALT_ROUNDS || 10)
    );
    return bcrypt.hash(password, salt);
  } catch (error) {
    log.error(
      `${funcName} something went wrong while creating password hash (throwing error to prevent creating user) with error ${error}`
    );
    throw new Error(`Password hashing failed`);
  }
};

const comparePassword = async (password: string, hash: string) =>
  bcrypt.compareSync(password, hash);

export default {
  hashPassword,
  comparePassword
};
