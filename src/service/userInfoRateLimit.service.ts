import userInfoRateLimitModel from "../model/userInfoRateLimit.model";
import { RateLimitResponse } from "../types/Response";

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  return userInfoRateLimitModel.consume(key, point);
};

export default {
  consume
};
