export type UserMetaData = {
  firstName?: string;
  lastName?: string;
};
export type UsersDocument = {
  _id?: string;
  email: string;
  password: string;
  user_metadata?: UserMetaData;
};

export type UpdateUserDocument = {
  _id?: string;
  email: string;
  password?: string;
  user_metadata?: UserMetaData;
};
