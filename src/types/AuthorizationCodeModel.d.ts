export type AuthorizationCodePayload = {
  userId: string;
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  callbackURL: string;
  scope: string = "openid profile email";
  sessionId: string;
};

export type AuthorizationCodeDocument = {
  _id?: string;
  lock: boolean;
  sessionId: string;
  payload: string;
};

export type ParsedAuthorizationCodeDocument = {
  code: string;
  payload: AuthorizationCodePayload;
  sessionId: string;
};
