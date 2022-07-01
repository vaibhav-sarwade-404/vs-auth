import loginRateLimitModel from "../model/loginRateLimit.model";
import { RateLimitResponse } from "../types/Response";

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  return loginRateLimitModel.consume(key, point);
};

const deleteDocumentByKey = async (key: string) => {
  return loginRateLimitModel.deleteDocumentByKey(key);
};

export default {
  consume,
  deleteDocumentByKey
};
