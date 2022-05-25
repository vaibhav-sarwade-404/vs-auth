import "express";
import { StateDocument } from "../../StateModel";

//Declaration merging
declare module "express" {
  interface Request {
    stateDocument?: StateDocument;
  }
}
