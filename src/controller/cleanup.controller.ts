import { Request, Response } from "express";

import cleanupService from "../service/cleanup.service";

export const cleanupController = async (req: Request, res: Response) => {
  return res.sendStatus(200);
};
