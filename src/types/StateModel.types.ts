export type StateDocument = {
  clientId: string;
  state: string;
  isValid: boolean;
};

export type FindByClientIdState = {
  clientId: string;
  state: string;
};
