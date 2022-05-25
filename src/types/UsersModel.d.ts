export type MetaData = {
  firstName?: string;
  lastName?: string;
};
export type UsersDocument = {
  _id?: string;
  email: string;
  password: string;
  meta_data?: MetaData;
};

export type UpdateUserDocument = {
  _id?: string;
  email: string;
  password?: string;
  meta_data?: MetaData;
};
