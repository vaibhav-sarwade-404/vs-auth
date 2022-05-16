import { Client } from "../model/authorize.model";

export type ClientDocumentKeys = keyof typeof Client;
export type FindByClientIdOptions = {
  exclude: ClientDocumentKeys[];
};

export interface QueryParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  code_chalenge?: string;
  code_chalenge_method?: string;
  scope?: string;
  state?: string;
}
