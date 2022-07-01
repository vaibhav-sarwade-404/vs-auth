import NodeMailer from "../model/transporter.model";
import { Logger } from "../utils/logger";

const sendEmail = async (email: string, subject: string, html: string) => {
  const logger = new Logger(sendEmail.name);
  let info = await NodeMailer.transporter.sendMail({
    from: `"VS Auth" <vs-auth@example.com>`,
    to: email,
    subject: subject,
    text: "Hello world?",
    html: html
  });
  logger.info(`email sent with status ${JSON.stringify(info)}`);
};

export default {
  sendEmail
};
