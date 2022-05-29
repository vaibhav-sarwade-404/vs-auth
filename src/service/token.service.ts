import fs from "fs";
import jwt, {  JwtPayload } from "jsonwebtoken";
import path from "path";

import { CreateJWTPayload, TokenResponse } from "../types/TokenModel";
import log from "../utils/logger";
import refreshTokenService from "./refreshToken.service";

const prepareTokenResponse = async ({
  user,
  clientId = "",
  scope,
  callbackURL
}: CreateJWTPayload): Promise<TokenResponse> => {
  const jwtSecret = fs.readFileSync(path.join("./privateKey.pem"));
  let refresh_token = "";
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
  if (scope.includes("offline_access")) {
    const refreshTokenDocument =
      await refreshTokenService.createRefreshTokenDocument({
        clientId,
        payload: JSON.stringify({ callbackURL, userId: user._id || "" }),
        lock: false
      });
    if (refreshTokenDocument) refresh_token = refreshTokenDocument.refreshToken;
  }
  return {
    access_token: accessToken,
    token_type: "Bearer",
    ...(refresh_token ? { refresh_token } : {}),
    expires_in: 86400
  };
};

const verifyAccessToken = (accessToken: string): string | JwtPayload => {
  const funcName = `token.service.${verifyAccessToken.name}`;
  try {
    const publicKey = fs.readFileSync(path.join("./publicKey.pem"));
    return jwt.verify(accessToken, publicKey);
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while verifying token with error ${error} `
    );
    return "";
  }
};

export default {
  prepareTokenResponse,
  verifyAccessToken
};
