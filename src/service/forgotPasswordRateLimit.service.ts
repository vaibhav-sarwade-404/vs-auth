import forgotPasswordRateLimitModel from "../model/forgotPasswordRateLimit.model";
import { RateLimitResponse } from "../types/Response";

const consume = async (
  key: string,
  point: number
): Promise<RateLimitResponse> => {
  return forgotPasswordRateLimitModel.consume(key, point);
};

export default {
  consume
};
