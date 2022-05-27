import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";

import { CreateJWTPayload, TokenEndpointResponse } from "../types/TokenModel";

const createJWT = async ({
  user,
  clientId = "",
  scope
}: CreateJWTPayload): Promise<TokenEndpointResponse> => {
  const jwtSecret = fs.readFileSync(path.join("./privateKey.pem"));
  const accessToken = jwt.sign(
    {
      sub: String(user._id),
      azp: clientId,
      scope
    },
    jwtSecret,
    {
      algorithm: "RS256",
      expiresIn: Number(process.env.JWT_EXPIRTY_IN_SECS || 86400),
      issuer: "vs-auth",
      keyid: "asdasd",
      header: { alg: "RS256", kid: "asdasd", typ: "JWT" },
      mutatePayload: true
    }
  );
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 86400
  };
};

export default {
  createJWT
};
