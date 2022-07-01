// export enum EMAIL_TYPES {
//   "VERIFY_EMAIL",
//   "PASSWORD_RESET_EMAIL",
//   "BLOCKED_ACCOUNT_EMAIL"
// }

export type EMAIL_TYPES =
  | "VERIFY_EMAIL"
  | "PASSWORD_RESET_EMAIL"
  | "BLOCKED_ACCOUNT_EMAIL";

export type EmailDocument = {
  email: EMAIL_TYPES;
  status: boolean;
  redirectTo: string;
  urlLifetime: number;
  subject: string;
  message: string;
};
