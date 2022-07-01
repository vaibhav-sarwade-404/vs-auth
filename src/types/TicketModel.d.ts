import { EMAIL_TYPES } from "./EmailsModel";

export type ClientInformation = {
  clientName: string;
  clientId: string;
};

export type TICKET_TYPES = EMAIL_TYPES;

export type TicketContext = {
  type: TICKET_TYPES;
  ip: string;
};

export type TicketDocument = {
  _id?: string;
  userId: string;
  clientInformation: ClientInformation;
  ticketContext: TicketContext;
  expires: Date;
};
