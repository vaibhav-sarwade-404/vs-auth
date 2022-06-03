export type RateLimitResponse = {
  points: number;
  consumedPoints: number;
  resetIn: number;
  isRateLimitReached: boolean;
  key: string;
};
