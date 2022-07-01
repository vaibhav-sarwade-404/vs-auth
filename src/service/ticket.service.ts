import ticketModel from "../model/ticket.model";
import { TicketDocument } from "../types/TicketModel";

const createTicket = async (
  ticketDoc: TicketDocument
): Promise<TicketDocument> => {
  return ticketModel.createTicket(ticketDoc);
};

const findTicketById = async (id: string): Promise<TicketDocument> => {
  return ticketModel.findTicketById(id);
};

const findAndDeleteTicketById = async (id: string): Promise<TicketDocument> => {
  return ticketModel.findAndDeleteTicketById(id);
};

const findAnddeleteTicketByOriginalId = async (
  id: string
): Promise<TicketDocument> => {
  return ticketModel.findAnddeleteTicketByOriginalId(id);
};

export default {
  createTicket,
  findTicketById,
  findAndDeleteTicketById,
  findAnddeleteTicketByOriginalId
};
