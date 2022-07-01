import "express-session";
import { ApisDocument } from "../../ApisModel";

type User = {
  clientId?: string = "";
  clientIp?: string | string[] = "";
  userId?: string;
  isAuthenticated?: boolean = false;
  scope?: string = "openid profile email";
  authorizationCode?: string = "";
  audience?: string = "";
  authorizeValidated?: boolean = false;
  apiDocument?: ApisDocument;
  _sessionId?: string;
};

//Declaration merging
declare module "express-session" {
  interface Session {
    user: User;
  }
}
