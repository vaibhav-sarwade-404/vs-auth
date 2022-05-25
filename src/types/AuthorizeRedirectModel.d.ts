import { Client } from "../model/client.model";

export type ClientDocumentKeys = keyof typeof Client;
export type FindByClientIdOptions = {
  exclude: ClientDocumentKeys[];
};

export interface QueryParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string = "code";
  code_challenge?: string;
  code_challenge_method?: string = "plain";
  scope?: string = "openid profile email";
  state?: string;
}
