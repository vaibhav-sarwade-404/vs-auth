import authorizeModel from "../model/authorize.model";
import { FindByClientIdOptions } from "../types/AuthorizeModel.types";
import { encrypt } from "../utils/crypto";

const getClientByClientId = (
  clientId: string,
  options?: FindByClientIdOptions
) => {
  return authorizeModel.findByClientId(clientId, options);
};

const getEncryptedState = (state: string, clientId: string): string => {
  const encryptedText = encrypt(
    JSON.stringify({ state, clientId, date: Date.now() }),
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
  return encodeURIComponent(encryptedText);
};

export default {
  getClientByClientId,
  getEncryptedState
};
