import mongoose, { Schema } from "mongoose";

import {
  ParsedRefreshTokenDocument,
  RefreshTokenDocument
} from "../types/RefreshTokenModel";
import constants from "../utils/constants";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";

const RefreshTokenSchema = new Schema(
  {
    clientId: { type: String, required: true },
    payload: { type: String, required: true },
    createdAt: {
      type: Date,
      expires: `${process.env.REFRESH_TOKEN_EXPIRTY_IN_SECS || 86400}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    autoCreate: true,
    expireAfterSeconds: Number(
      process.env.REFRESH_TOKEN_EXPIRTY_IN_SECS || 86400
    )
  }
);

RefreshTokenSchema.pre("save", async function (next) {
  this.payload = encrypt(
    this.payload,
    process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "",
    "base64"
  );
  next();
});

RefreshTokenSchema.post("save", async function () {
  const encryptedRefreshToken = encrypt(
    this._id.toString(),
    process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "",
    "base64"
  );
  // this.refreshToken = encodeURIComponent(encryptedRefreshToken);
  this.refreshToken = encryptedRefreshToken;
});

RefreshTokenSchema.statics.parseRefreshTokenDocument = (
  refreshTokenDocument: RefreshTokenDocument
): ParsedRefreshTokenDocument => {
  const funcName = `RefreshTokenSchema.statics.parseRefreshTokenDocument`;
  let parsedRefreshTokenDocument: ParsedRefreshTokenDocument = {
    clientId: refreshTokenDocument.clientId,
    _id: refreshTokenDocument._id,
    payload: { callbackURL: "", userId: "" },
    refreshToken: ""
  };
  try {
    if (refreshTokenDocument) {
      const decryptedPayload = decrypt(
        refreshTokenDocument.payload || "",
        process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "",
        "base64"
      );
      const refreshToken = encrypt(
        refreshTokenDocument._id || "",
        process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "",
        "base64"
      );
      parsedRefreshTokenDocument.refreshToken = refreshToken;
      parsedRefreshTokenDocument.payload = JSON.parse(decryptedPayload);
    }
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while decrypting and parsing refresh token payload with error ${error}`
    );
  }
  return parsedRefreshTokenDocument;
};

const RefreshTokenModel = mongoose.model(
  "RefreshToken",
  RefreshTokenSchema,
  constants.COLlECTIONS.refreshToken
);

const findRefreshTokenById = (
  id: string
): Promise<ParsedRefreshTokenDocument> => {
  const funcName = findRefreshTokenById.name;
  return RefreshTokenModel.findOne({ _id: id })
    .then(refreshTokenDocument => {
      if (refreshTokenDocument)
        return RefreshTokenModel.parseRefreshTokenDocument(
          refreshTokenDocument
        );
      return refreshTokenDocument;
    })
    .catch(error => {
      log.error(
        `${funcName}: Something went wrong while fetching refresh token document by id (${id}) with error :${error}`
      );
    });
};

const createRefreshToken = async (
  refreshTokenDocument: RefreshTokenDocument
): Promise<ParsedRefreshTokenDocument> => {
  const funcName = findRefreshTokenById.name;
  return RefreshTokenModel.create(refreshTokenDocument).catch(error => {
    log.error(
      `${funcName}: Something went wrong while saving refresh token document with payload (${JSON.stringify(
        refreshTokenDocument
      )}) with error :${error}`
    );
  });
};

const deleteRefreshTokenDocumentById = async (id: string): Promise<any> => {
  const funcName = findRefreshTokenById.name;
  return RefreshTokenModel.deleteOne({ _id: id }).catch(error => {
    log.error(
      `${funcName}: Something went wrong while deleting refresh token document by id (${id}) with error :${error}`
    );
  });
};

export default {
  findRefreshTokenById,
  createRefreshToken,
  deleteRefreshTokenDocumentById
};
