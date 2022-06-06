export enum Algorithms {
  "RS256"
}
export type ApisDocument = {
  _id?: string;
  name: string;
  type: string;
  identifier: string;
  tokenExpiry: number;
  tokenSigningAlgo: string;
  permissions: [string];
};
