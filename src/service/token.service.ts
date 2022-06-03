import fs from "fs";
import jwt, { JwtPayload } from "jsonwebtoken";
import path from "path";

import { CreateJWTPayload, TokenResponse } from "../types/TokenModel";
import log from "../utils/logger";
import refreshTokenService from "./refreshToken.service";

const prepareTokenResponse = async ({
  user,
  clientId = "",
  scope,
  callbackURL,
  sessionId
}: CreateJWTPayload): Promise<TokenResponse> => {
  const funcName = prepareTokenResponse.name;
  try {
    const jwtSecret = fs.readFileSync(
      path.join(__dirname, "..", "..", "certs", "privateKey.pem")
    );
    const jwtPublicKey = JSON.parse(
      fs
        .readFileSync(
          path.join(__dirname, "..", "..", "public", ".well-known", "jwks.json")
        )
        .toString()
    );
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
        keyid: jwtPublicKey.kid,
        header: { alg: "RS256", kid: jwtPublicKey.kid, typ: "JWT" },
        mutatePayload: true
      }
    );
    if (scope.includes("offline_access")) {
      const refreshTokenDocument =
        await refreshTokenService.createRefreshTokenDocument({
          clientId,
          payload: JSON.stringify({ callbackURL, userId: user._id || "" }),
          lock: false,
          sessionId
        });
      if (refreshTokenDocument)
        refresh_token = refreshTokenDocument.refreshToken;
    }
    return {
      access_token: accessToken,
      token_type: "Bearer",
      ...(refresh_token ? { refresh_token } : {}),
      expires_in: 86400
    };
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generting token response with error :${error}`
    );
    throw new Error("Token generation error");
  }
};

const verifyAccessToken = (accessToken: string): string | JwtPayload => {
  const funcName = `token.service.${verifyAccessToken.name}`;
  try {
    const publicKey = fs.readFileSync(
      path.join(__dirname, "..", "..", "certs", "publicKey.pem")
    );
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
