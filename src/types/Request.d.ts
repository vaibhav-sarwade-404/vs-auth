import { ClientApi } from "./AuthorizeRedirectModel";
import { PageNames } from "./PagesModel";
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
  client_secret?: string;
  redirect_uri?: string;
  scope?: string = "openid profile email offline_access";
  code_verifier?: string;
  code?: string;
  refresh_token?: string;
  audience?: string;
}

export interface LogoutRequest {
  client_id: string;
  redirect_uri: string;
}

export type ForgotPasswordRequest = {
  client_id: string;
  email: string;
};

export type ChangePasswordRequest = {
  ticket: string;
  newPassword: string;
  _csrf: string;
};

export type TicketRequestParams = {
  ticket?: string;
};

export type CreateClientRequest = {
  applicationType: "spa" | "m2m";
  clientName: string;
  api: ClientApi;
};

export type ClientRUDWithPathParam = {
  clientId?: string;
};

export type PagesHtmlUpdatePathParam = {
  page?: PageNames;
};

export type UserRUDWithPathParam = {
  userId?: string;
};

export type PagesHtmlUpdateRequest = {
  page: PageNames;
  html: string;
};

export type UpdateClientRequest = {
  clientSecret?: string;
  allowedCallbackUrls?: string[];
  allowedLogoutUrls?: string[];
  idTokenExpiry?: number;
  refreshTokenRotation?: boolean;
  refreshTokenExpiry?: number;
  grantTypes?: string[];
  clientName?: string;
  api?: ClientApi;
};

export type UpdateUserRequest = {
  email?: string;
  email_verified?: boolean;
  password?: string;
  user_metadata?: UserMetaData;
};

export type CreateUserRequest = {
  email: string;
  email_verified: boolean;
  password: string;
  user_metadata: UserMetaData;
};
