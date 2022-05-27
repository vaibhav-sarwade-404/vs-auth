import { NextFunction, Request, Response } from "express";
import authorizationcodeService from "../service/authorizationcode.service";
import passwordService from "../service/password.service";
import stateService from "../service/state.service";

import usersService from "../service/users.service";
import { LoginRequest, SignupRequest } from "../types/Request";
import log from "../utils/logger";

const signup = async (req: Request, resp: Response) => {
  const funcName = signup.name;
  try {
    const {
      email = "",
      password = "",
      meta_data = {}
    }: SignupRequest = req.body || {};
    const user = await usersService.findUserByEmail(email);
    if (user) {
      log.error(`${funcName}: user already exist with email id( ${email} )`);
      return resp.status(400).json({
        validations: [{ fieldName: "email", fieldError: "user already exist" }]
      });
    }
    const _user = await usersService.createUserDocument({
      email,
      password,
      meta_data
    });
    return resp.status(200).json(_user);
  } catch (error) {
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

const login = async (req: Request, resp: Response) => {
  const funcName = login.name;
  const {
    email = "",
    password = "",
    callbackURL,
    clientId,
    state
  }: LoginRequest = req.body || {};
  const referrerSearchParams = new URL(req.headers.referer || "").searchParams;
  const codeChallenge = referrerSearchParams.get("code_challenge") || "";
  const codeChallengeMethod =
    referrerSearchParams.get("code_challenge_method") || "";
  try {
    const user = await usersService.findUserByEmail(email);
    const isValidPassword = await passwordService.comparePassword(
      password,
      user.password
    );
    if (isValidPassword) {
      let formattedCallbackURL = new URL(callbackURL);
      let decryptedState = "";

      if (!req.stateDocument?.state) {
        decryptedState = await stateService.getDecryptedState({
          clientId,
          state
        });
      } else {
        decryptedState = stateService.decryptState(
          decodeURIComponent(req.stateDocument.state)
        );
      }
      const authorizationCodeDocument =
        await authorizationcodeService.createAuthourizationCodeDocument({
          userId: user._id?.toString() || "",
          clientId,
          codeChallenge,
          codeChallengeMethod,
          callbackURL
        });
      formattedCallbackURL.searchParams.set(
        "code",
        authorizationCodeDocument.id
      );
      formattedCallbackURL.searchParams.set("state", decryptedState);
      log.info(
        `${funcName}: login for user with email( ${email} ) was successful, returning user to callback`
      );
      const { user: sessionUser } = req.session;
      req.session.regenerate(err => {
        if (err) {
          throw new Error(`While generating session error: ${err}`);
        }
        req.session.user = {
          ...sessionUser,
          userId: user._id?.toString() || "",
          isAuthenticated: true
        };
        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(err => {
          if (err) {
            throw new Error(`While generating session error: ${err}`);
          }
          return resp.status(200).json({
            redirect_uri: formattedCallbackURL.href
          });
        });
      });
    } else {
      log.info(
        `${funcName}: login for user with email( ${email} ) was not successful, returning user to error`
      );
      return resp.status(403).json({
        error: "Username or password is wrong"
      });
    }
  } catch (error) {
    log.error(
      `${funcName}: Login failed for user with email( ${email} ) with error ${error}`
    );
    return resp.status(400).json({
      error: "something went wrong"
    });
  }
};

export default {
  signup,
  login
};
