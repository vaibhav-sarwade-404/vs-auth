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
    lock: { type: Boolean },
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

const encryptRefreshTokenDocumentParams = (str: string = "") => {
  return encrypt(str, process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "", "base64");
};
const decryptRefreshTokenDocumentParams = (str: string = "") => {
  return decrypt(str, process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "", "base64");
};

RefreshTokenSchema.pre("save", async function (next) {
  const funcName = `RefreshTokenSchema.pre.save`;
  log.debug(
    `${funcName}: encrypting payload before saving refresh token document`
  );
  this.payload = encryptRefreshTokenDocumentParams(this.payload);
  next();
});

RefreshTokenSchema.post("save", async function () {
  const funcName = `RefreshTokenSchema.post.save`;
  log.debug(`${funcName}: encrypting _id after saving refresh token document`);
  const encryptedRefreshToken = encryptRefreshTokenDocumentParams(
    this._id.toString()
  );
  this.refreshToken = encryptedRefreshToken;
});

RefreshTokenSchema.statics.parseRefreshTokenDocument = (
  refreshTokenDocument: RefreshTokenDocument
): ParsedRefreshTokenDocument => {
  const funcName = `RefreshTokenSchema.statics.parseRefreshTokenDocument`;
  let parsedRefreshTokenDocument: ParsedRefreshTokenDocument = {
    clientId: refreshTokenDocument.clientId,
    _id: refreshTokenDocument._id?.toString(),
    payload: { callbackURL: "", userId: "" },
    refreshToken: ""
  };
  try {
    if (refreshTokenDocument) {
      log.debug(`${funcName}: parsing refresh token document`);
      const decryptedPayload = decryptRefreshTokenDocumentParams(
        refreshTokenDocument.payload || ""
      );
      const refreshToken = encryptRefreshTokenDocumentParams(
        refreshTokenDocument._id || ""
      );
      parsedRefreshTokenDocument.refreshToken = refreshToken;
      parsedRefreshTokenDocument.payload = JSON.parse(decryptedPayload);
      log.debug(`${funcName}: refresh token document successfully parsed`);
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

const findRefreshTokenById = async (
  id: string
): Promise<ParsedRefreshTokenDocument> => {
  const funcName = findRefreshTokenById.name;
  const decryptedId = decryptRefreshTokenDocumentParams(id);
  log.debug(
    `${funcName}: finding refresh token document with id (${decryptedId})`
  );
  return RefreshTokenModel.findOne({
    _id: new mongoose.Types.ObjectId(decryptedId)
  })
    .then(refreshTokenDocument => {
      if (refreshTokenDocument) {
        log.debug(
          `${funcName}: refresh token document found with id (${decryptedId}), return parsed version`
        );
        return RefreshTokenModel.parseRefreshTokenDocument(
          refreshTokenDocument
        );
      }
      log.debug(
        `${funcName}: refresh token document not found with id (${decryptedId})`
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
  log.debug(`${funcName}: creating refresh token document `);
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
  const decryptedId = decryptRefreshTokenDocumentParams(id);
  log.debug(
    `${funcName}: deleting refresh token document with id (${decryptedId}) `
  );
  return RefreshTokenModel.deleteOne({
    _id: new mongoose.Types.ObjectId(decryptedId)
  }).catch(error => {
    log.error(
      `${funcName}: Something went wrong while deleting refresh token document by id (${id}) with error :${error}`
    );
  });
};

const findRefreshTokenByIdAndLock = async (
  id: string
): Promise<ParsedRefreshTokenDocument> => {
  const funcName = findRefreshTokenByIdAndLock.name;
  const decryptedId = decryptRefreshTokenDocumentParams(id);
  log.debug(
    `${funcName}: finding refresh token document with id (${decryptedId})`
  );
  return RefreshTokenModel.findOneAndUpdate(
    {
      $and: [{ _id: new mongoose.Types.ObjectId(decryptedId) }, { lock: false }]
    },
    { lock: true }
  )
    .then(refreshTokenDocument => {
      if (refreshTokenDocument) {
        log.debug(
          `${funcName}: refresh token document found with id (${decryptedId}), locked and return parsed version`
        );
        return RefreshTokenModel.parseRefreshTokenDocument(
          refreshTokenDocument
        );
      }
      log.debug(
        `${funcName}: refresh token document not found with id (${decryptedId})`
      );
      return refreshTokenDocument;
    })
    .catch(error => {
      log.error(
        `${funcName}: Something went wrong while fetching refresh token document by id (${id}) with error :${error}`
      );
    });
};

export default {
  findRefreshTokenById,
  createRefreshToken,
  deleteRefreshTokenDocumentById,
  findRefreshTokenByIdAndLock
};
