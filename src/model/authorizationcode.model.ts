import mongoose, { Schema } from "mongoose";
import uid from "uid-safe";

import {
  AuthorizationCodeDocument,
  ParsedAuthorizationCodeDocument
} from "../types/AuthorizationCodeModel";
import constants from "../utils/constants";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";

const AuthorizationCodeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    payload: { type: String, required: true },
    createdAt: {
      type: Date,
      // expires: `${
      //   process.env.AUTHORIZATION_CODE_EXPIRTY_IN_SECS || 12000000000
      // }s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    autoCreate: true
    // expireAfterSeconds: Number(
    //   process.env.AUTHORIZATION_CODE_EXPIRTY_IN_SECS || 12000000000
    // )
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

AuthorizationCodeSchema.statics.parseAuthorizationCodeDocument = (
  authorizationCodeDocument: AuthorizationCodeDocument
) => {
  const funcName = `AuthorizationCodeSchema.statics.parseAuthorizationCodeDocument`;
  try {
    if (authorizationCodeDocument) {
      const decryptedPayload = decrypt(
        authorizationCodeDocument.payload,
        process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
        "base64"
      );
      return {
        ...authorizationCodeDocument,
        payload: JSON.parse(decryptedPayload)
      };
    }
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while decrypting and parsing payload with error ${error}`
    );
  }

  return authorizationCodeDocument;
};

const AuthorizationCodeModel = mongoose.model(
  "AuthorizationCode",
  AuthorizationCodeSchema,
  constants.COLlECTIONS.authorizationCode
);

const findAuthorizationCodeDocumentById = (
  id: string
): Promise<ParsedAuthorizationCodeDocument> => {
  const funcName = findAuthorizationCodeDocumentById.name;
  return AuthorizationCodeModel.findOne({ id })
    .then(authorizationCodeDocument =>
      AuthorizationCodeModel.parseAuthorizationCodeDocument(
        authorizationCodeDocument
      )
    )
    .catch(err => {
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

const deleteAuthorizationCodeDocumentById = (id: string): Promise<any> => {
  const funcName = deleteAuthorizationCodeDocumentById.name;
  return AuthorizationCodeModel.deleteOne({ id }).catch(err => {
    log.error(
      `${funcName}: Something went wrong while deleting authorization code document by id (${id}) with error: ${err}`
    );
  });
};

export default {
  findAuthorizationCodeDocumentById,
  createAuthorizationCodeDocumentBy,
  deleteAuthorizationCodeDocumentById
};
