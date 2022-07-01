//If update required, make sure it is udpated in validatoin schemas
export type PageNames = "login" | "error" | "password_reset";

export type PageDocument = {
  page: string;
  html: string;
};
