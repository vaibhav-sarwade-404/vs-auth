import clientModel from "../model/client.model";
import {
  ClientDocument,
  FindByClientIdOptions
} from "../types/AuthorizeRedirectModel";
import { CreateClientRequest, UpdateClientRequest } from "../types/Request";
import constants from "../utils/constants";
import { generateRandomChars } from "../utils/crypto";
import apiService from "./api.service";

const generateClientId = () =>
  generateRandomChars([
    { ruleName: "uppercase", numberOfChars: 13 },
    { ruleName: "lowercase", numberOfChars: 13 },
    { ruleName: "numbers", numberOfChars: 6 }
  ]);

const generateClientSecrete = () =>
  generateRandomChars([
    { ruleName: "uppercase", numberOfChars: 20 },
    { ruleName: "uppercase", numberOfChars: 6 },
    { ruleName: "lowercase", numberOfChars: 20 },
    { ruleName: "uppercase", numberOfChars: 6 },
    { ruleName: "numbers", numberOfChars: 6 },
    { ruleName: "symbols", numberOfChars: 6 }
  ]);

const getClientByClientId = (
  clientId: string,
  options?: FindByClientIdOptions
): Promise<ClientDocument> => {
  return clientModel.findByClientId(clientId, options);
};

const createClient = (client: CreateClientRequest): Promise<ClientDocument> => {
  let defaultValues: any = constants.CLIENT_DEFAULT_VALUES.spa;
  if (client.applicationType === "m2m") {
    defaultValues = constants.CLIENT_DEFAULT_VALUES.m2m;
  }
  const _client: ClientDocument = {
    ...client,
    ...defaultValues,
    clientId: generateClientId(),
    clientSecret: generateClientSecrete()
  };
  return clientModel.createClient(_client);
};

const updateClient = (
  clientId: string,
  client: UpdateClientRequest
): Promise<ClientDocument> => {
  delete client.clientSecret;
  delete client.clientName;
  return clientModel.updateClient(clientId, client);
};

const deleteClient = (clientId: string): Promise<ClientDocument> => {
  return clientModel.deleteClient(clientId);
};

const rotateClientSecret = (clientId: string): Promise<ClientDocument> => {
  return clientModel.updateClient(clientId, {
    clientSecret: generateClientSecrete()
  });
};

export default {
  getClientByClientId,
  createClient,
  updateClient,
  deleteClient,
  rotateClientSecret
};
