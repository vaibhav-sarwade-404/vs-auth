import mongoose, { Schema } from "mongoose";

import constants from "../utils/constants";
import { Logger } from "../utils/logger";
import { EmailDocument, EMAIL_TYPES } from "../types/EmailModel";

const EmailSchema = new Schema(
  {
    email: { type: String, required: true },
    status: { type: String, required: true },
    redirectTo: { type: String, required: true },
    urlLifetime: { type: Number, required: true, default: 432000 },
    subject: { type: String, required: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

const EmailModel = mongoose.model(
  "Email",
  EmailSchema,
  constants.COLlECTIONS.emails
);

const getEmailDocument = async (email: EMAIL_TYPES): Promise<EmailDocument> => {
  const logger = new Logger(getEmailDocument.name);
  return EmailModel.findOne({ email }).catch(err => {
    logger.error(
      `Something went wrong while fetching email document with error: ${err}`
    );
  });
};

const updateEmailDocument = async (
  emailDocument: EmailDocument
): Promise<EmailDocument | null> => {
  return EmailModel.findOneAndUpdate(
    { email: emailDocument.email },
    emailDocument
  );
};

export default { getEmailDocument, updateEmailDocument };
