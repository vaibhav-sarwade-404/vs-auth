import authorizationcodeModel from "../model/authorizationcode.model";
import {
  AuthorizationCodePayload,
  ParsedAuthorizationCodeDocument
} from "../types/AuthorizationCodeModel";
import { createSHA256 } from "../utils/crypto";
import log from "../utils/logger";

const getAuthourizationCodeDocumentById = async (
  id: string
): Promise<ParsedAuthorizationCodeDocument> => {
  return authorizationcodeModel.findAuthorizationCodeDocumentById(id);
};

const deleteAuthourizationCodeDocumentById = async (
  id: string
): Promise<any> => {
  return authorizationcodeModel.deleteAuthorizationCodeDocumentById(id);
};

const createAuthourizationCodeDocument = async (
  payload: AuthorizationCodePayload
): Promise<ParsedAuthorizationCodeDocument> => {
  const stringifiedPayload = JSON.stringify(payload);
  return authorizationcodeModel.createAuthorizationCodeDocument({
    payload: stringifiedPayload
  });
};

const isCodeVerifierValid = async (
  authorizationCodeDocument: ParsedAuthorizationCodeDocument,
  codeVerifier: string = ""
): Promise<boolean> => {
  const funcName = isCodeVerifierValid.name;
  try {
    if (!authorizationCodeDocument) return false;
    const { codeChallengeMethod = "", codeChallenge } =
      authorizationCodeDocument.payload;
    if (codeChallengeMethod) {
      if (codeChallengeMethod.toLowerCase() === "s256") {
        const generatedHash = createSHA256(codeVerifier);
        if (generatedHash === codeChallenge) return true;
      } else {
        return codeVerifier === codeChallenge;
      }
    }
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while fetching and validating Authorization code ${authorizationCodeDocument.code} with error:${error}`
    );
  }
  return false;
};

export default {
  getAuthourizationCodeDocumentById,
  deleteAuthourizationCodeDocumentById,
  createAuthourizationCodeDocument,
  isCodeVerifierValid
};
