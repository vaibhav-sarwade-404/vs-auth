import { UsersDocument } from "./UsersModel";

export type GrantTypes = "authorization_code" | "refresh_token";

export type CreateJWTPayload = {
  clientId: string;
  user: UsersDocument;
  scope: string = "openid profile email";
  grant_type: GrantTypes;
  callbackURL: string;
};

export type AuthorizationCodeRequest = {
  client_id: string = "";
  grant_type: "authorization_code";
  code: string = "";
  code_verifier: string = "";
  redirect_uri: string;
  scope: string = "openid profile email";
};
export type RefreshTokenRequest = {
  client_id: string = "";
  grant_type: "refresh_token";
  redirect_uri: string;
  refresh_token: string;
  scope: string = "openid profile email offline_access";
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string = "Bearer";
  expires_in: number = 86400;
};
