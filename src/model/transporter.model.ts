import nodemailer from "nodemailer";

class NodeMailer {
  private static _instance: NodeMailer;
  private _transporter;
  public constructor() {
    this._transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });
  }

  static getInstance() {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new NodeMailer();
    return this._instance;
  }

  public get transporter() {
    return this._transporter;
  }
}

export default new NodeMailer();
