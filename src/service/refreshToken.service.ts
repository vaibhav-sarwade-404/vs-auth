import refreshTokenModel from "../model/refreshToken.model";
import {
  ParsedRefreshTokenDocument,
  RefreshTokenDocument
} from "../types/RefreshTokenModel";
import { decrypt } from "../utils/crypto";
import log from "../utils/logger";

const getRefreshTokenDocument = async (
  encryptedId: string
): Promise<ParsedRefreshTokenDocument> => {
  const decryptedId = decryptRefreshToken(encryptedId);
  return refreshTokenModel.findRefreshTokenById(decryptedId);
};

const createRefreshTokenDocument = (
  refreshTokenDocument: RefreshTokenDocument
) => {
  return refreshTokenModel.createRefreshToken(refreshTokenDocument);
};

const decryptRefreshToken = (encryptedStr: string) => {
  const funcName = decryptRefreshToken.name;
  try {
    return decrypt(
      encryptedStr,
      process.env.REFRESH_TOKEN_ENCRYPTION_KEY || "",
      "base64"
    );
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while decrypted refresh token string, returning original string with error: ${error}`
    );
    return encryptedStr;
  }
};

const deleteRefreshTokenDocument = (refreshToken: string) => {
  const decryptedId = decryptRefreshToken(refreshToken);
  return refreshTokenModel.deleteRefreshTokenDocumentById(decryptedId);
};

export default {
  getRefreshTokenDocument,
  createRefreshTokenDocument,
  deleteRefreshTokenDocument
};
