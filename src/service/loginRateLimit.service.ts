import loginRateLimitModel from "../model/loginRateLimit.model";
import { RateLimitResponse } from "../types/Response";

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  return loginRateLimitModel.consume(key, point);
};

export default {
  consume
};
