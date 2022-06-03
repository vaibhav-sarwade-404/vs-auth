export type LoginRateLimitTypes = "login_" | "fl_";

type LoginRateLimitKey = keyof typeof LoginRateLimitTypes;

export type LoginRateLimitDocument = {
  key: string;
  points: number;
  createdAt?: Date;
};
