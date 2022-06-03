import mongoose, { Schema } from "mongoose";

import { UserInfoRateLimitDocument } from "../types/UserInfoRateLimitModel";
import { RateLimitResponse } from "../types/Response";
import constants from "../utils/constants";
import log from "../utils/logger";

const UserInfoRateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    points: { type: Number, required: true, default: 0 },
    createdAt: {
      type: Date,
      expires: `${Number(
        process.env.USER_INFO_RATE_LIMIT_RESET_IN_SECS || 3600
      )}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    expireAfterSeconds: Number(
      process.env.USER_INFO_RATE_LIMIT_RESET_IN_SECS || 3600
    )
  }
);

UserInfoRateLimitSchema.statics.parseRateLimitResponse = (
  userInfoRateLimitDocument: UserInfoRateLimitDocument
): RateLimitResponse => {
  const funcName = `UserInfoRateLimitSchema.statics.parseRateLimitResponse`;
  let defauleRateLimitResponse = {
    points: Number(process.env.USER_INFO_POINTS || 10),
    consumedPoints: 1,
    isRateLimitReached: false,
    resetIn: new Date(
      ((userInfoRateLimitDocument &&
        userInfoRateLimitDocument.createdAt?.getTime()) ||
        Date.now()) +
        Number(process.env.USER_INFO_RATE_LIMIT_RESET_IN_SECS || 3600)
    ).getTime(),
    key: "userInfo_api"
  };
  if (userInfoRateLimitDocument) {
    log.info(
      `${funcName}: formatting UserInfoRateLimitDocument with RateLimitResponse for key (${userInfoRateLimitDocument.key})`
    );
    return {
      ...defauleRateLimitResponse,
      consumedPoints: userInfoRateLimitDocument.points + 1,
      isRateLimitReached:
        userInfoRateLimitDocument.points >= defauleRateLimitResponse.points,
      resetIn: defauleRateLimitResponse.resetIn + 20 * 1000,
      key: userInfoRateLimitDocument.key
    };
  }
  return defauleRateLimitResponse;
};

const UserInfoRateLimitModel = mongoose.model(
  "UserInfoRateLimit",
  UserInfoRateLimitSchema,
  constants.COLlECTIONS.userInfoRateLimit
);

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  const funcName = consume.name;
  log.info(`${funcName}: consuming rate limit point for key (${key})`);
  return UserInfoRateLimitModel.findOneAndUpdate(
    {
      $and: [
        { key: key },
        { points: { $lt: Number(process.env.USER_INFO_POINTS || 10) } }
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
    .then(userInfoRateLimitDocument =>
      UserInfoRateLimitModel.parseRateLimitResponse(userInfoRateLimitDocument)
    )
    .catch(error => {
      if (error && error.code === 11000) {
        log.info(
          `${funcName}: duplicate key error for key(${key}), so finding document and returning reponse`
        );
        return UserInfoRateLimitModel.findOne({ key })
          .then(userInfoRateLimitDocument =>
            UserInfoRateLimitModel.parseRateLimitResponse(
              userInfoRateLimitDocument
            )
          )
          .catch(_error => {
            log.error(
              `${funcName}: something went wrong while find and updating userInfoRateLimitDocument document ${JSON.stringify(
                key
              )} with error: ${_error}`
            );
            return UserInfoRateLimitModel.parseRateLimitResponse();
          });
      }
      log.error(
        `${funcName}: something went wrong while find and updating userInfoRateLimitDocument document ${JSON.stringify(
          key
        )} with error: ${error}`
      );
      log.info(`${funcName}: return default response document for rate limit`);
      return UserInfoRateLimitModel.parseRateLimitResponse();
    });
};

export default { consume };
