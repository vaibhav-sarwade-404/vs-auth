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
