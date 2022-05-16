import mongoose, { Schema } from "mongoose";

import { FindByClientIdOptions } from "../types/AuthorizeModel.types";
import constants from "../utils/constants";
import log from "../utils/logger";

export const Client = {
  clientName: { type: String, required: true },
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  applicationType: { type: String, required: true },
  allowedCallbackUrls: { type: [String], required: true },
  allowedLogoutUrls: { type: [String], required: true },
  idTokenExpiry: { type: Number, required: true },
  refreshTokenRotation: { type: Boolean, required: true },
  refreshTokenExpiry: { type: Number, required: true },
  grantTypes: { type: [String], required: true },
  scopes: { type: [String], required: true }
};

const ClientSchema = new Schema(Client, { timestamps: true });
const ClientModel = mongoose.model(
  "Client",
  ClientSchema,
  constants.COLlECTIONS.clients
);

const findByClientId = async (
  clientId: string,
  options?: FindByClientIdOptions
) => {
  const funcName = findByClientId.name;
  try {
    let computedOptions: { exclude: Object } = { exclude: {} };
    if (options && options.exclude) {
      computedOptions.exclude = options.exclude.reduce(
        (prevOption, currentOption) => ({ ...prevOption, [currentOption]: 0 }),
        {}
      );
    }
    return ClientModel.findOne({ clientId }, computedOptions);
  } catch (error) {
    log.error(
      `${funcName}: client not found or something went wrong while finding client for client id : ${clientId} with error: ${error}`
    );
  }
};

export default {
  findByClientId,
  ClientSchema,
  ClientModel
};
