export type UserInfoRateLimitTypes = "userInfo_api";

type UserInfoRateLimitKey = keyof typeof UserInfoRateLimitTypes;

export type UserInfoRateLimitDocument = {
  key: string;
  points: number;
  createdAt?: Date;
};

export type UserInfoLimitConsumePayload = {
  key: "uiApi_";
  ip: string;
  points: number;
};
