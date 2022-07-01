import { Liquid } from "liquidjs";

import { ClientDocument } from "../types/AuthorizeRedirectModel";
import { LogDocument } from "../types/LogModel";
import { UserDocument } from "../types/UsersModel";
import emailModel from "../model/email.model";
import { EmailDocument, EMAIL_TYPES } from "../types/EmailModel";
import logService from "./log.service";
import ticketService from "./ticket.service";
import transporterService from "./transporter.service";
import dateUtils from "../utils/dateUtils";
import { Logger } from "../utils/logger";
import constants from "../utils/constants";

const getEmailDocument = async (emailType: EMAIL_TYPES) => {
  return emailModel.getEmailDocument(emailType);
};

const updateEmailDocument = async (emailDocument: EmailDocument) => {
  return emailModel.updateEmailDocument(emailDocument);
};

const sendUserEmail = async (
  type: EMAIL_TYPES,
  userDocument: UserDocument,
  clientDocument?: ClientDocument,
  logDocument?: LogDocument
) => {
  const logger = new Logger(`email.service.${sendUserEmail.name}`);
  try {
    const emailDocument = await getEmailDocument(type);
    const ticketDocument = await ticketService
      .createTicket({
        clientInformation: {
          clientId: clientDocument?.clientId || "",
          clientName: clientDocument?.clientName || ""
        },
        ticketContext: {
          type,
          ip: logDocument?.ip || ""
        },
        userId: userDocument._id?.toString() || "",
        expires: dateUtils.getISODate({
          addSeconds: emailDocument.urlLifetime
        })
      })
      .catch(err => {
        throw new Error(err);
      });
    if (!ticketDocument) {
      throw new Error(`something went wrong while creating ticket document`);
    }

    const url = `${process.env.HOST || "http://localhost:3001/"}${
      constants.EMAIL_ACTION_ROUTES[type]
    }`;
    const _url = new URL(url);
    _url.searchParams.append("ticket", ticketDocument._id || "xx");
    const engine = new Liquid();
    const tpl = engine.parse(emailDocument.message);
    await new Promise((resolve, reject) => {
      engine
        .render(tpl, {
          firstName: userDocument.user_metadata?.firstName,
          url: _url.href,
          ip: logDocument?.ip || ""
        })
        .then(async message => {
          await transporterService
            .sendEmail(userDocument.email, emailDocument.subject, message)
            .catch(err => {
              logger.error(
                `something went wrong while sending email with error: ${err}`
              );
              reject(err);
            });
        });
      resolve(1);
    })
      .then(async () => {
        if (logDocument) {
          //Log type and decription should be added by calling function
          await logService.createLogEvent({
            ...logDocument,
            client_id: clientDocument?.clientId,
            client_name: clientDocument?.clientName,
            email: userDocument.email
          });
        }
      })
      .catch(err => {
        throw new Error(err);
      });
  } catch (error) {
    logger.error(
      `something went wrong while sending email to ${userDocument.email} with error: ${error}`
    );
  }
};

export default {
  getEmailDocument,
  updateEmailDocument,
  sendUserEmail
};
