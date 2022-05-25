import authorizationcodeModel from "../model/authorizationcode.model";
import { AuthorizationCodeDocument } from "../types/AuthorizationCodeModel";
import { generateHMAC } from "../utils/crypto";

const getAuthourizationCodeDocumentById = async (
  id: string
): Promise<AuthorizationCodeDocument> => {
  return authorizationcodeModel.findAuthorizationCodeDocumentById(id);
};

const createAuthourizationCodeDocument = async (
  payload: string
): Promise<AuthorizationCodeDocument> => {
  const id = generateHMAC(
    payload,
    process.env.AUTHORIZATION_CODE_ENCRYPTION_KEY || ""
  );
  return authorizationcodeModel.createAuthorizationCodeDocumentBy({
    id,
    payload
  });
};

export default {
  getAuthourizationCodeDocumentById,
  createAuthourizationCodeDocument
};
