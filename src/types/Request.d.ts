import { MetaData } from "./UsersModel";

export interface SignupRequest {
  clientId: string;
  callbackURL: string;
  state: string;
  _csrf: string;
  email: string;
  password: string;
  meta_data?: MetaData;
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
  grant_type: string;
  client_id: string;
  code_verifier: string;
  code: string;
  redirect_uri: string;
  scope: string;
}
