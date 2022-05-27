import "express";
import { LogDocument } from "../../LogModel";
import { StateDocument } from "../../StateModel";

//Declaration merging
declare module "express" {
  interface Request {
    stateDocument?: StateDocument;
    logDocument?: LogDocument;
  }
}
