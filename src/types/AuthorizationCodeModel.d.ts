export type AuthorizationCodePayload = {
  userId: string;
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  callbackURL: string;
  scope: string = "openid profile email";
};

export type AuthorizationCodeDocument = {
  _id?: string;
  lock: boolean;
  payload: string;
};

export type ParsedAuthorizationCodeDocument = {
  code: string;
  payload: AuthorizationCodePayload;
};
