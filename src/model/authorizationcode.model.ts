import mongoose, { Schema } from "mongoose";
import uid from "uid-safe";

import { AuthorizationCodeDocument } from "../types/AuthorizationCodeModel";
import constants from "../utils/constants";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";

const getDecryptedPayload = (payload: string) => {
  const funcName = getDecryptedPayload.name;
  try {
    return decrypt(
      payload,
      process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
      "base64"
    );
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while decrypting payload with error ${error}`
    );
    return payload;
  }
};

const AuthorizationCodeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    payload: { type: String, required: true },
    createdAt: {
      type: Date,
      expires: `${process.env.AUTHORIZATION_CODE_EXPIRTY || 120}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    autoCreate: true,
    expireAfterSeconds: Number(process.env.AUTHORIZATION_CODE_EXPIRTY || 2)
  }
);

AuthorizationCodeSchema.pre("save", async function (next) {
  this.id = `${uid.sync(10)}.${this.id}`;
  this.payload = encrypt(
    this.payload,
    process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
    "base64"
  );
  next();
});

AuthorizationCodeSchema.post("findOne", function (doc, next) {
  const funcName = "AuthorizationCodeSchema.post.findOne";
  try {
    doc.payload = decrypt(
      doc.payload,
      process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
      "base64"
    );
    next();
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while decrypting payload with error ${error}`
    );
    next();
  }
});

const AuthorizationCodeModel = mongoose.model(
  "AuthorizationCode",
  AuthorizationCodeSchema,
  constants.COLlECTIONS.authorizationCode
);

const findAuthorizationCodeDocumentById = (
  id: string
): Promise<AuthorizationCodeDocument> => {
  const funcName = findAuthorizationCodeDocumentById.name;
  return AuthorizationCodeModel.findOne({ id }).catch(err => {
    log.error(
      `${funcName}: Something went wrong while getting authorization code document by id (${id}) with error: ${err}`
    );
  });
};

const createAuthorizationCodeDocumentBy = (
  authorizationCodeDocument: AuthorizationCodeDocument
): Promise<AuthorizationCodeDocument> => {
  const funcName = createAuthorizationCodeDocumentBy.name;
  return AuthorizationCodeModel.create(authorizationCodeDocument).catch(err => {
    log.error(
      `${funcName}: Something went wrong while creating authorization code document for payload (${JSON.stringify(
        authorizationCodeDocument.payload
      )}) with error: ${err}`
    );
  });
};

export default {
  findAuthorizationCodeDocumentById,
  createAuthorizationCodeDocumentBy
};
