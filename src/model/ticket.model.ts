import mongoose, { Schema } from "mongoose";

import { TicketDocument } from "../types/TicketModel";
import constants from "../utils/constants";
import { decrypt, encrypt } from "../utils/crypto";
import { Logger } from "../utils/logger";

const ClientInformationSchema = new Schema({
  clientName: { type: String, required: true },
  clientId: { type: String, required: true }
});

const TicketContext = new Schema({
  type: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  }
});

const TicketSchema = new Schema(
  {
    userId: { type: String, required: true },
    clientInformation: { type: ClientInformationSchema, required: true },
    ticketContext: { type: TicketContext, required: true },
    expires: {
      type: Date,
      default: null,
      index: true,
      expires: 0
    }
  },
  {
    timestamps: true
  }
);

// TicketSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

TicketSchema.statics.parseTicketDocument = (ticketDocument: TicketDocument) => {
  const funcName = `TicketSchema.statics.parseTicketDocument`;
  const logger = new Logger(funcName);
  const id = ticketDocument._id?.toString();
  logger.debug(`${funcName}: parsing document id:${id}`);
  try {
    return {
      _id: encryptTicketId(id) || id,
      userId: ticketDocument.userId,
      clientInformation: ticketDocument.clientInformation,
      TicketContext: ticketDocument.ticketContext,
      expires: ticketDocument.expires
    };
  } catch (error) {
    logger.error(
      `${funcName}: something went wrong while parsing ticket document with error ${error}`
    );
  }
  return ticketDocument;
};

const TicketModel = mongoose.model(
  "Ticket",
  TicketSchema,
  constants.COLlECTIONS.ticket
);

const encryptTicketId = (str: string = "") => {
  return encrypt(str, process.env.TICKET_ID_ENCRYPTION_KEY || "", "base64");
};
const decryptTicketId = (str: string = "") => {
  return decrypt(str, process.env.TICKET_ID_ENCRYPTION_KEY || "", "base64");
};

const createTicket = async (
  ticketDoc: TicketDocument
): Promise<TicketDocument> => {
  const funcName = createTicket.name;
  const logger = new Logger(funcName);
  return TicketModel.create(ticketDoc)
    .then(ticketDocument => {
      logger.debug(`ticket document is created, parse it before returning`);
      return TicketModel.parseTicketDocument(ticketDocument);
    })
    .catch(err => {
      logger.error(
        `Something went wrong while creating ticket with error: ${err}`
      );
    });
};

const findTicketById = async (id: string) => {
  const funcName = findTicketById.name;
  const logger = new Logger(funcName);
  const _id = decryptTicketId(id);
  return TicketModel.findById(new mongoose.Types.ObjectId(_id)).catch(err => {
    logger.error(
      `Something went wrong while finding ticket with id(${id}) with error: ${err}`
    );
  });
};

const findAnddeleteTicketByOriginalId = async (id: string) => {
  const funcName = findTicketById.name;
  const logger = new Logger(funcName);
  return TicketModel.findByIdAndDelete(new mongoose.Types.ObjectId(id)).catch(
    err => {
      logger.error(
        `Something went wrong while find and delete ticket with id(${id}) with error: ${err}`
      );
    }
  );
};

const findAndDeleteTicketById = async (id: string) => {
  const funcName = findTicketById.name;
  const logger = new Logger(funcName);
  const _id = decryptTicketId(id);
  logger.info(
    `decrypted ticket id(${_id}), processing findAnddeleteTicketByOriginalId`
  );
  return findAnddeleteTicketByOriginalId(_id);
};

export default {
  createTicket,
  findAndDeleteTicketById,
  findTicketById,
  findAnddeleteTicketByOriginalId
};
