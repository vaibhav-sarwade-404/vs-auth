import { Request, Response } from "express";

import usersService from "../service/users.service";
import { SignupRequest } from "../types/Request.types";
import log from "../utils/logger";

const signup = async (req: Request, res: Response) => {
  const funcName = signup.name;
  try {
    const {
      email = "",
      password = "",
      meta_data = {}
    }: SignupRequest = req.body || {};
    const user = await usersService.findUserByEmail(email);
    if (user) {
      log.error(`${funcName} user already exist with email id( ${email} )`);
      return res.status(400).json({
        validations: [{ fieldName: "email", fieldError: "user already exist" }]
      });
    }
    const _user = await usersService.createUserDocument({
      email,
      password,
      meta_data
    });
    return res.status(200).json(_user);
  } catch (error) {
    return res.status(400).json({
      error: "something went wrong"
    });
  }
};

export default {
  signup
};
