import "express";
import { ClientDocument } from "../../AuthorizeRedirectModel";
import { EmailDocument } from "../../EmailModel";
import { LogDocument } from "../../LogModel";
import { StateDocument } from "../../StateModel";
import { TicketDocument } from "../../TicketModel";

//Declaration merging
declare module "express" {
  interface Request {
    stateDocument?: StateDocument;
    logDocument?: LogDocument;
    clientDocument?: ClientDocument;
    ticketDocument?: TicketDocument;
    emailDocument?: EmailDocument;
  }
}
