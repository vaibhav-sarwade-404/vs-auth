import refreshTokenModel from "../model/refreshToken.model";
import {
  ParsedRefreshTokenDocument,
  RefreshTokenDocument
} from "../types/RefreshTokenModel";

const getRefreshTokenDocument = async (
  encryptedId: string
): Promise<ParsedRefreshTokenDocument> => {
  return refreshTokenModel.findRefreshTokenById(encryptedId);
};

const createRefreshTokenDocument = (
  refreshTokenDocument: RefreshTokenDocument
) => {
  return refreshTokenModel.createRefreshToken(refreshTokenDocument);
};

const deleteRefreshTokenDocument = (refreshToken: string) => {
  return refreshTokenModel.deleteRefreshTokenDocumentById(refreshToken);
};

const getRefreshTokenDocumentAndLock = async (
  encryptedId: string
): Promise<ParsedRefreshTokenDocument> => {
  return refreshTokenModel.findRefreshTokenByIdAndLock(encryptedId);
};

const deleteRefreshTokensDocumentBySessionId = async (sessionId: string) => {
  return refreshTokenModel.deleteRefreshTokensDocumentBySessionId(sessionId);
};

export default {
  getRefreshTokenDocument,
  createRefreshTokenDocument,
  deleteRefreshTokenDocument,
  getRefreshTokenDocumentAndLock,
  deleteRefreshTokensDocumentBySessionId
};
