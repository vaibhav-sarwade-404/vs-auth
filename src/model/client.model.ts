import mongoose, { Schema } from "mongoose";

import {
  ClientDocument,
  FindByClientIdOptions
} from "../types/AuthorizeRedirectModel";
import { UpdateClientRequest } from "../types/Request";
import constants from "../utils/constants";
import { Logger } from "../utils/logger";

const fileName = `client.model.`;

const Api = {
  apiId: { type: String, require: true },
  scopes: { type: [String], required: true }
};

export const Client = {
  clientName: { type: String, required: true },
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  applicationType: { type: String, required: true },
  allowedCallbackUrls: { type: [String], required: false },
  allowedLogoutUrls: { type: [String], required: false },
  idTokenExpiry: { type: Number, required: true },
  refreshTokenRotation: { type: Boolean, required: true },
  refreshTokenExpiry: { type: Number, required: true },
  grantTypes: { type: [String], required: true },
  api: { type: Api, required: false }
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
): Promise<ClientDocument> => {
  const log = new Logger(`$${fileName}${findByClientId.name}`);
  let computedOptions: { exclude?: Object } = {};
  if (options && options.exclude) {
    computedOptions.exclude = options.exclude.reduce(
      (prevOption, currentOption) => ({ ...prevOption, [currentOption]: 0 }),
      {}
    );
  }
  return ClientModel.findOne({ clientId }, computedOptions).catch(error =>
    log.error(
      `something went wrong while fetching client document with client id (${clientId}) with error: ${error}`
    )
  );
};

const createClient = async (
  clientDocument: ClientDocument
): Promise<ClientDocument> => {
  const log = new Logger(`$${fileName}${createClient.name}`);
  return ClientModel.create(clientDocument).catch(error =>
    log.error(
      `something went wrong creating new client document with client id (${clientDocument.clientId}) with error: ${error}`
    )
  );
};

const updateClient = async (
  clientId: string,
  client: UpdateClientRequest
): Promise<ClientDocument> => {
  const log = new Logger(`$${fileName}${updateClient.name}`);
  return ClientModel.findOneAndUpdate({ clientId }, client, {
    new: true
  }).catch(error =>
    log.error(
      `something went wrong updating client document with client id (${clientId}) with error: ${error}`
    )
  );
};

const deleteClient = async (clientId: string): Promise<ClientDocument> => {
  const log = new Logger(`$${fileName}${deleteClient.name}`);
  return ClientModel.findOneAndDelete({ clientId }).catch(error =>
    log.error(
      `something went wrong deleting client document with client id (${clientId}) with error: ${error}`
    )
  );
};

export default {
  findByClientId,
  ClientSchema,
  ClientModel,
  createClient,
  updateClient,
  deleteClient
};
