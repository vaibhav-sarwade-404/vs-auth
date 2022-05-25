export type CleanupDocument = {
  collectionName: string;
  id: string;
  cleaned: boolean;
  error: string;
};

export type FindByClientIdState = {
  clientId: string;
  state: string;
};
