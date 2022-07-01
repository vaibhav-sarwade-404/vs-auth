export type UserMetaData = {
  firstName?: string;
  lastName?: string;
};

export type UserDocument = {
  _id?: string;
  email: string;
  email_verified: boolean;
  password: string;
  passwordHistory: string[];
  user_metadata?: UserMetaData;
  login_count?: number;
  blocked_for?: string[];
};

export type UpdateUserDocument = {
  _id?: string;
  email?: string;
  email_verified?: boolean;
  passwordHistory?: string[];
  password?: string;
  user_metadata?: UserMetaData;
  login_count?: number;
  blocked_for?: string[];
};

export type BlockUserForIp = {
  _id: string;
  ip: string;
};
