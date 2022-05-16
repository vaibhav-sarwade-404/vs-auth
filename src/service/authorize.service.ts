import authorizeModel from "../model/authorize.model";
import { FindByClientIdOptions } from "../types/AuthorizeModel.types";
import { createCipher } from "../utils/crypto";

const getClientByClientId = (
  clientId: string,
  options?: FindByClientIdOptions
) => {
  return authorizeModel.findByClientId(clientId, options);
};

const getEncryptedState = async (
  state: string,
  clientId: string
): Promise<string> => {
  return createCipher(
    `${state}${clientId}${Date.now()}`,
    process.env.STATE_ENCRYPTION_KEY || "",
    "base64"
  );
};

export default {
  getClientByClientId,
  getEncryptedState
};
