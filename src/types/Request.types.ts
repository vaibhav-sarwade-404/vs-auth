import { MetaData } from "./UsersModel.types";

export interface SignupRequest {
  clientId: string;
  callbackURL: string;
  state: string;
  _csrf: string;
  email: string;
  password: string;
  meta_data?: MetaData;
}
