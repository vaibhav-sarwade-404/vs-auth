import mongoose, { Schema } from "mongoose";
import { ForgotPasswordRateLimitDocument } from "../types/ForgotPasswordRateLimitModel";

import { RateLimitResponse } from "../types/Response";
import constants from "../utils/constants";
import { Logger } from "../utils/logger";

const ForgotPasswordRateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    points: { type: Number, required: true, default: 0 },
    createdAt: {
      type: Date,
      expires: `${Number(
        process.env.FORGOT_PASSWORD_RATE_LIMIT_RESET_IN_SECS || 3600
      )}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    expireAfterSeconds: Number(
      process.env.FORGOT_PASSWORD_RATE_LIMIT_RESET_IN_SECS || 3600
    )
  }
);

ForgotPasswordRateLimitSchema.statics.parseRateLimitResponse = (
  forgotPasswordRateLimitDocument: ForgotPasswordRateLimitDocument
): RateLimitResponse => {
  const funcName = `ForgotPasswordRateLimitSchema.statics.parseRateLimitResponse`;
  const log = new Logger(funcName);
  let defauleRateLimitResponse = {
    points: Number(process.env.FORGOT_PASSWORD_POINTS || 10),
    consumedPoints: 1,
    isRateLimitReached: false,
    resetIn: new Date(
      ((forgotPasswordRateLimitDocument &&
        forgotPasswordRateLimitDocument.createdAt?.getTime()) ||
        Date.now()) +
        Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_RESET_IN_SECS || 3600)
    ).getTime(),
    key: "forgotPassword_api"
  };
  if (forgotPasswordRateLimitDocument) {
    log.info(
      `${funcName}: formatting forgotPasswordRateLimitDocument with RateLimitResponse for key (${forgotPasswordRateLimitDocument.key})`
    );
    return {
      ...defauleRateLimitResponse,
      consumedPoints: forgotPasswordRateLimitDocument.points + 1,
      isRateLimitReached:
        forgotPasswordRateLimitDocument.points >=
        defauleRateLimitResponse.points,
      resetIn: defauleRateLimitResponse.resetIn + 20 * 1000,
      key: forgotPasswordRateLimitDocument.key
    };
  }
  return defauleRateLimitResponse;
};

const ForgotPasswordRateLimitModel = mongoose.model(
  "ForgotPasswordRateLimit",
  ForgotPasswordRateLimitSchema,
  constants.COLlECTIONS.forgotPasswordRateLimit
);

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  const funcName = consume.name;
  const log = new Logger(funcName);
  log.info(`${funcName}: consuming rate limit point for key (${key})`);
  return ForgotPasswordRateLimitModel.findOneAndUpdate(
    {
      $and: [
        { key: key },
        { points: { $lt: Number(process.env.FORGOT_PASSWORD_POINTS || 10) } }
      ]
    },
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
    .then(forgotPasswordRateLimitDocument =>
      ForgotPasswordRateLimitModel.parseRateLimitResponse(
        forgotPasswordRateLimitDocument
      )
    )
    .catch(error => {
      if (error && error.code === 11000) {
        log.info(
          `${funcName}: duplicate key error for key(${key}), so finding document and returning reponse`
        );
        return ForgotPasswordRateLimitModel.findOne({ key })
          .then(forgotPasswordRateLimitDocument =>
            ForgotPasswordRateLimitModel.parseRateLimitResponse(
              forgotPasswordRateLimitDocument
            )
          )
          .catch(_error => {
            log.error(
              `${funcName}: something went wrong while find and updating forgotPasswordRateLimitDocument document ${JSON.stringify(
                key
              )} with error: ${_error}`
            );
            return ForgotPasswordRateLimitModel.parseRateLimitResponse();
          });
      }
      log.error(
        `${funcName}: something went wrong while find and updating forgotPasswordRateLimitDocument document ${JSON.stringify(
          key
        )} with error: ${error}`
      );
      log.info(`${funcName}: return default response document for rate limit`);
      return ForgotPasswordRateLimitModel.parseRateLimitResponse();
    });
};

export default { consume };
