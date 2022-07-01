// export enum LogTypes {
//   "unsupported_response_type",
//   "invalid_request",
//   "success_login",
//   "failed_login",
//   "success_signup",
//   "failed_signup",
//   "success_delete",
//   "failed_delete",
//   "unauthorized",
//   "success_code_exchange",
//   "success_refresh_token_exchange",
//   "failed_code_exchange",
//   "failed_refresh_token_exchange"
// }

export type LogTypes =
  | "unsupported_response_type"
  | "invalid_request"
  | "success_login"
  | "failed_login"
  | "success_signup"
  | "failed_signup"
  | "success_delete"
  | "failed_delete"
  | "unauthorized"
  | "success_code_exchange"
  | "success_refresh_token_exchange"
  | "failed_code_exchange"
  | "failed_refresh_token_exchange"
  | "success_change_password_request"
  | "success_verification_email_sent"
  | "success_blocked_account_email_sent";

type LogTypesKey = keyof typeof LogTypes;

export type LogDocument = {
  type?: LogTypes;
  client_id?: string;
  client_name?: string;
  ip?: string;
  user_agent?: string;
  user_id?: string;
  decription?: string;
  email?: string;
};

export type LogEventKey = {
  SEND_VERIFY_EMAIL: "s";
};
