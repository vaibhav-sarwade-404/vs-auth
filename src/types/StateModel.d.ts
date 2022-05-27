export type StateDocument = {
  _id?: string;
  clientId: string;
  state: string;
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
  id: string;
  clientId: string;
  state?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
