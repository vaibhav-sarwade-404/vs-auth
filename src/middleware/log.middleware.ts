import { Request, Response, NextFunction } from "express";

import { QueryParams } from "../types/AuthorizeRedirectModel";
import { LogDocument } from "../types/LogModel";

export default async (req: Request, _resp: Response, next: NextFunction) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const { "user-agent": user_agent = "" } = req.headers;
  const { client_id = "" }: QueryParams = req.query || {};
  const { clientId = "" } = req.body || {};
  const logDocument: LogDocument = {
    ip: ip.toString(),
    client_id: client_id || clientId || "",
    user_agent
  };
  req.logDocument = logDocument;
  return next();
};
