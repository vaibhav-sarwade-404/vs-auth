export type AuthorizationCodeDocument = {
  id: string;
  payload: string;
};

export type AuthorizationCodePayload = {
  userId: string;
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  callbackURL: string;
};

export type ParsedAuthorizationCodeDocument = {
  id: string;
  payload: AuthorizationCodePayload;
};
