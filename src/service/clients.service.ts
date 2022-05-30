import clientModel from "../model/client.model";
import {
  ClientDocument,
  FindByClientIdOptions
} from "../types/AuthorizeRedirectModel";

const getClientByClientId = (
  clientId: string,
  options?: FindByClientIdOptions
): Promise<ClientDocument> => {
  return clientModel.findByClientId(clientId, options);
};

export default {
  getClientByClientId
};
