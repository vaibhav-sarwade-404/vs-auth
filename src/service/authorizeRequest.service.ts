import clientModel from "../model/client.model";
import { FindByClientIdOptions } from "../types/AuthorizeRedirectModel";

const getClientByClientId = (
  clientId: string,
  options?: FindByClientIdOptions
) => {
  return clientModel.findByClientId(clientId, options);
};

export default {
  getClientByClientId
};
