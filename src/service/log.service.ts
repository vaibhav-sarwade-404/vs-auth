import logModel from "../model/log.model";
import { LogDocument } from "../types/LogModel";

const createLogEvent = async (log: LogDocument) => {
  return logModel.createLogDocument(log);
};

export default {
  createLogEvent
};
