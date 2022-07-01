export type ForgotPasswordRateLimitDocument = {
  key: string;
  points: number;
  createdAt?: Date;
};

export type ForgotPasswordLimitConsumePayload = {
  key: "forgotPass_";
  ip: string;
  points: number;
};
