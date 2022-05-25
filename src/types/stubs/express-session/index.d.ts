import "express-session";

type User = {
  clientId?: string = "";
  clientIp?: string | string[] = "";
  userId?: string;
  isAuthenticated?: boolean = false;
};

//Declaration merging
declare module "express-session" {
  interface Session {
    user: User;
  }
}
