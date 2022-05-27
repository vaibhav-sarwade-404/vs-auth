import { UsersDocument } from "./UsersModel";

export type CreateJWTPayload = {
  clientId: string;
  user: UsersDocument;
  scope: string = "openid profile email";
};

export type TokenEndpointResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string = "Bearer";
  expires_in: number = 86400;
};
