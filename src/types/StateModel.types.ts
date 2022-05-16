export type StateDocument = {
  _id?: string;
  clientId: string;
  state: string;
  isValid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateStateDocument = {
  _id?: string;
  clientId?: string;
  state?: string;
  isValid?: boolean;
};

export type FindByClientIdState = {
  clientId: string;
  state: string;
  createdAt?: Date;
  updatedAt?: Date;
};
