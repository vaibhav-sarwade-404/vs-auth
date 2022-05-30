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
    lock: { type: Boolean },
    sessionId: { type: String, required: true },
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

const encryptAuthCodeDocumentParams = (str: string = "") => {
  return encrypt(
    str,
    process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
    "base64"
  );
};
const decryptAuthCodeDocumentParams = (str: string = "") => {
  return decrypt(
    str,
    process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
    "base64"
  );
};

AuthorizationCodeSchema.pre("save", async function (next) {
  const funcName = "AuthorizationCodeSchema.pre.save";
  log.debug(`${funcName}: encrypting payload for saving`);
  this.payload = encryptAuthCodeDocumentParams(this.payload);
  log.debug(`${funcName}: successfully encrypted payload for saving`);
  next();
});

AuthorizationCodeSchema.post("save", async function () {
  const funcName = "AuthorizationCodeSchema.post.save";
  log.debug(`${funcName}: encrypting _id to return as 'code' for end users`);
  const encryptedCode = encryptAuthCodeDocumentParams(this._id.toString());
  this.code = encryptedCode;
  log.debug(`${funcName}: successfully encrypted _id`);
});

AuthorizationCodeSchema.statics.parseAuthorizationCodeDocument = (
  authorizationCodeDocument: AuthorizationCodeDocument
) => {
  const funcName = `AuthorizationCodeSchema.statics.parseAuthorizationCodeDocument`;
  log.debug(
    `${funcName}: parsing document id:${authorizationCodeDocument._id}`
  );
  try {
    const decryptedPayload = decrypt(
      authorizationCodeDocument.payload,
      process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
      "base64"
    );
    const encryptedCode = encrypt(
      authorizationCodeDocument._id?.toString() || "",
      process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || "",
      "base64"
    );
    log.debug(
      `${funcName}: parsed document successfully id:${authorizationCodeDocument._id}`
    );
    return {
      code: encryptedCode,
      payload: JSON.parse(decryptedPayload),
      sessionId: authorizationCodeDocument.sessionId
    };
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

const findAuthorizationCodeDocumentById = async (
  id: string
): Promise<ParsedAuthorizationCodeDocument> => {
  const funcName = findAuthorizationCodeDocumentById.name;
  const decryptedId = decryptAuthCodeDocumentParams(id);
  log.debug(
    `${funcName}: fetching Authorization document with id:${{ decryptedId }}`
  );
  return AuthorizationCodeModel.findOne({
    _id: new mongoose.Types.ObjectId(decryptedId)
  })
    .then(authorizationCodeDocument => {
      if (authorizationCodeDocument) {
        log.debug(
          `${funcName}: Document found with id:${decryptedId} ${authorizationCodeDocument}`
        );
        return AuthorizationCodeModel.parseAuthorizationCodeDocument(
          authorizationCodeDocument
        );
      }
      log.debug(`${funcName}: Document not foung with id:${decryptedId}`);
      return authorizationCodeDocument;
    })
    .catch(err => {
      log.error(
        `${funcName}: Something went wrong while getting authorization code document by id (${decryptedId}) with error: ${err}`
      );
    });
};

const createAuthorizationCodeDocument = (
  authorizationCodeDocument: AuthorizationCodeDocument
): Promise<ParsedAuthorizationCodeDocument> => {
  const funcName = createAuthorizationCodeDocument.name;
  log.debug(`${funcName}: creating authorization code document`);
  return AuthorizationCodeModel.create(authorizationCodeDocument).catch(err => {
    log.error(
      `${funcName}: Something went wrong while creating authorization code document for payload (${JSON.stringify(
        authorizationCodeDocument.payload
      )}) with error: ${err}`
    );
  });
};

const deleteAuthorizationCodeDocumentById = async (
  id: string
): Promise<any> => {
  const funcName = deleteAuthorizationCodeDocumentById.name;
  log.debug(`${funcName}: deleting authorization code document by id`);
  const decryptedId = decryptAuthCodeDocumentParams(id);
  return AuthorizationCodeModel.deleteOne({
    _id: new mongoose.Types.ObjectId(decryptedId)
  }).catch(err => {
    log.error(
      `${funcName}: Something went wrong while deleting authorization code document by id (${id}) with error: ${err}`
    );
  });
};

const findAuthorizationCodeDocumentByIdAndLock = async (
  id: string
): Promise<ParsedAuthorizationCodeDocument> => {
  const funcName = findAuthorizationCodeDocumentByIdAndLock.name;
  const decryptedId = decryptAuthCodeDocumentParams(id);
  log.debug(`${funcName}: fetching Authorization document with id:${id}`);
  return AuthorizationCodeModel.findOneAndUpdate(
    {
      $and: [{ _id: new mongoose.Types.ObjectId(decryptedId) }, { lock: false }]
    },
    { lock: true }
  )
    .then(authorizationCodeDocument => {
      if (authorizationCodeDocument) {
        log.debug(
          `${funcName}: Document found with id:${decryptedId} and locked`
        );
        return AuthorizationCodeModel.parseAuthorizationCodeDocument(
          authorizationCodeDocument
        );
      }
      log.debug(
        `${funcName}: Document not foung with id:${decryptedId} and no lock`
      );
      return authorizationCodeDocument;
    })
    .catch(err => {
      log.error(
        `${funcName}: Something went wrong while getting authorization code document by id (${decryptedId}) with error: ${err}`
      );
    });
};

export default {
  findAuthorizationCodeDocumentById,
  createAuthorizationCodeDocument,
  deleteAuthorizationCodeDocumentById,
  findAuthorizationCodeDocumentByIdAndLock
};
