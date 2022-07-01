import mongoose, { Schema } from "mongoose";

import { LoginRateLimitDocument } from "../types/LoginRateLimitModel";
import { RateLimitResponse } from "../types/Response";
import constants from "../utils/constants";
import log from "../utils/logger";

const LoginRateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    points: { type: Number, required: true, default: 0 },
    createdAt: {
      type: Date,
      expires: `${Number(process.env.LOGIN_RATE_LIMIT_RESET_IN_SECS || 3600)}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    expireAfterSeconds: Number(
      process.env.LOGIN_RATE_LIMIT_RESET_IN_SECS || 3600
    )
  }
);

LoginRateLimitSchema.statics.parseRateLimitResponse = (
  loginRateLimitDocument: LoginRateLimitDocument
): RateLimitResponse => {
  const funcName = `LoginRateLimitSchema.statics.parseRateLimitResponse`;
  let points = Number(process.env.LOGIN_REQUEST_POINTS || 100);

  if (
    loginRateLimitDocument &&
    loginRateLimitDocument.key.startsWith(
      constants.RATE_LIMIT_KEYS.failedEmailPasswordLogin
    )
  ) {
    points = Number(process.env.FAILED_LOGIN_REQUEST_POINTS || 100);
  }
  let defauleRateLimitResponse = {
    points,
    consumedPoints: 1,
    isRateLimitReached: false,
    resetIn: new Date(
      ((loginRateLimitDocument &&
        loginRateLimitDocument.createdAt?.getTime()) ||
        Date.now()) + Number(process.env.LOGIN_RATE_LIMIT_RESET_IN_SECS || 3600)
    ).getTime(),
    key: "login_api"
  };
  if (loginRateLimitDocument) {
    log.info(
      `${funcName}: formatting LoginRateLimitDocument with RateLimitResponse for key (${loginRateLimitDocument.key})`
    );
    return {
      ...defauleRateLimitResponse,
      consumedPoints: loginRateLimitDocument.points + 1,
      isRateLimitReached:
        loginRateLimitDocument.points >= defauleRateLimitResponse.points,
      resetIn: defauleRateLimitResponse.resetIn + 20 * 1000,
      key: loginRateLimitDocument.key
    };
  }
  return defauleRateLimitResponse;
};

const LoginRateLimitModel = mongoose.model(
  "LoginRateLimit",
  LoginRateLimitSchema,
  constants.COLlECTIONS.loginRateLimit
);

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  const funcName = consume.name;
  log.info(`${funcName}: consuming rate limit point for key (${key})`);
  return LoginRateLimitModel.findOneAndUpdate(
    { $and: [{ key: key }, { points: { $lt: 10 } }] },
    {
      $setOnInsert: {
        key
      },
      $inc: { points: point }
    },
    {
      upsert: true
    }
  )
    .then(loginRateLimitDocument =>
      LoginRateLimitModel.parseRateLimitResponse(loginRateLimitDocument)
    )
    .catch(error => {
      if (error && error.code === 11000) {
        log.info(
          `${funcName}: duplicate key error for key(${key}), so finding document and returning reponse`
        );
        return LoginRateLimitModel.findOne({ key })
          .then(loginRateLimitDocument =>
            LoginRateLimitModel.parseRateLimitResponse(loginRateLimitDocument)
          )
          .catch(_error => {
            log.error(
              `${funcName}: something went wrong while find and updating LoginRateLimitDocument document ${JSON.stringify(
                key
              )} with error: ${_error}`
            );
            return LoginRateLimitModel.parseRateLimitResponse();
          });
      }
      log.error(
        `${funcName}: something went wrong while find and updating LoginRateLimitDocument document ${JSON.stringify(
          key
        )} with error: ${error}`
      );
      log.info(`${funcName}: return default response document for rate limit`);
      return LoginRateLimitModel.parseRateLimitResponse();
    });
};

const deleteDocumentByKey = async (key: string): Promise<RateLimitResponse> => {
  const funcName = deleteDocumentByKey.name;
  log.info(`${funcName}: consuming rate limit point for key (${key})`);
  return LoginRateLimitModel.findOneAndDelete({ key: key }).catch(error => {
    log.error(
      `${funcName}: something went wrong while find and updating LoginRateLimitDocument document ${JSON.stringify(
        key
      )} with error: ${error}`
    );
  });
};

export default { consume, deleteDocumentByKey };
