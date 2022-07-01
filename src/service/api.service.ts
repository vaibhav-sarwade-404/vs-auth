import apiModel from "../model/api.model";
import { ApisDocument } from "../types/ApisModel";

const findApiByIdentifier = async (
  identifier: string
): Promise<ApisDocument> => {
  return apiModel.findApiByIdentifier(identifier);
};

const findByApiId = async (id: string): Promise<ApisDocument> => {
  return apiModel.findByApiId(id);
};

export default {
  findApiByIdentifier,
  findByApiId
};
