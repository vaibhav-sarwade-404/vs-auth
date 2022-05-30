import { GrantTypes } from "./TokenModel";
import { UserMetaData } from "./UsersModel";

export interface SignupRequest {
  clientId: string;
  callbackURL: string;
  state: string;
  _csrf: string;
  email: string;
  password: string;
  user_metadata?: UserMetaData;
}

export interface LoginRequest {
  clientId: string;
  callbackURL: string;
  state: string;
  _csrf: string;
  email: string;
  password: string;
}

export interface TokenRequest {
  grant_type: GrantTypes;
  client_id: string;
  redirect_uri: string;
  scope: string = "openid profile email offline_access";
  code_verifier?: string;
  code?: string;
  refresh_token?: string;
}

export interface LogoutRequest {
  client_id: string;
  redirect_uri: string;
}
