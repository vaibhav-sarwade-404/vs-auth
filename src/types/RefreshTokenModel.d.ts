export type RefreshTokenPayload = {
  userId: string;
  callbackURL: string;
};

export type RefreshTokenDocument = {
  _id?: string;
  clientId: string;
  payload: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ParsedRefreshTokenDocument = {
  _id?: string;
  clientId: string;
  createdAt?: Date;
  updatedAt?: Date;
  refreshToken: string;
  payload: RefreshTokenPayload;
};
