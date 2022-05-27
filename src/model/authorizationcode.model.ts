import mongoose, { Schema } from "mongoose";

import {
  AuthorizationCodeDocument,
  ParsedAuthorizationCodeDocument
} from "../types/AuthorizationCodeModel";
import constants from "../utils/constants";
import { decrypt, encrypt } from "../utils/crypto";
import log from "../utils/logger";

const AuthorizationCodeSchema = new Schema(
  {
    payload: { type: String, required: true },
    createdAt: {
      type: Date,
      expires: `${process.env.AUTHORIZATION_CODE_EXPIRTY_IN_SECS || 120}s`,
      default: Date.now
    }
  },
  {
    timestamps: true,
    autoCreate: true,
    expireAfterSeconds: Number(
      process.env.AUTHORIZATION_CODE_EXPIRTY_IN_SECS || 120
    )
  }
);

AuthorizationCodeSchema.pre("save", async function (next) {
  this.payload = encrypt(
    this.payload,
    process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
    "base64"
  );
  next();
});

AuthorizationCodeSchema.post("save", async function () {
  const encryptedCode = encrypt(
    this._id.toString(),
    process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
    "base64"
  );
  // this.code = encodeURIComponent(encryptedCode);
  this.code = encryptedCode;
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
    .then(authorizationCodeDocument => {
      if (authorizationCodeDocument)
        return AuthorizationCodeModel.parseAuthorizationCodeDocument(
          authorizationCodeDocument
        );
      return authorizationCodeDocument;
    })
    .catch(err => {
      log.error(
        `${funcName}: Something went wrong while getting authorization code document by id (${id}) with error: ${err}`
      );
    });
};

const createAuthorizationCodeDocument = (
  authorizationCodeDocument: AuthorizationCodeDocument
): Promise<ParsedAuthorizationCodeDocument> => {
  const funcName = createAuthorizationCodeDocument.name;
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
  createAuthorizationCodeDocument,
  deleteAuthorizationCodeDocumentById
};
