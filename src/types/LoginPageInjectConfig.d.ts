export type LoginPageConfig = {
  clientId: string;
  callbackURL: string;
  state: string;
  responseType: string;
  scope: string;
  _csrf: string;
};

export type PasswordResetConfig = {
  _csrf: string;
};
