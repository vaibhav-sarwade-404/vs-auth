import fs from "fs";
import jwt, { Algorithm, JwtPayload } from "jsonwebtoken";
import path from "path";

import { CreateJWTPayload, TokenResponse } from "../types/TokenModel";
import log from "../utils/logger";
import apiService from "./api.service";
import refreshTokenService from "./refreshToken.service";

const prepareEndUserTokenResponse = async ({
  user,
  clientId = "",
  scope,
  callbackURL,
  audience = "",
  sessionId
}: CreateJWTPayload): Promise<TokenResponse> => {
  const funcName = prepareEndUserTokenResponse.name;
  try {
    const api = await apiService.findApiByIdentifier(audience);
    let tokenExpiry = process.env.JWT_EXPIRTY_IN_SECS || 86400;
    if (api) {
      tokenExpiry = api.tokenExpiry;
    }
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
    let refresh_token = "",
      id_token = "";
    const payload = {
      sub: String(user._id),
      azp: clientId,
      scope,
      aud: [audience, `${audience}/userinfo`]
    };

    const accessToken = jwt.sign(payload, jwtSecret, {
      algorithm: "RS256",
      expiresIn: Number(tokenExpiry),
      issuer: "vs-auth",
      keyid: jwtPublicKey.kid,
      header: { alg: "RS256", kid: jwtPublicKey.kid, typ: "JWT" },
      mutatePayload: true
    });
    if (scope.includes("openid")) {
      id_token = jwt.sign(
        {
          ...payload,
          ...(audience ? { "https://vs-auth.com/email": user.email } : {})
        },
        jwtSecret
      );
    }
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
      ...(id_token ? { id_token } : {}),
      expires_in: 86400
    };
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generting token response with error :${error}`
    );
    throw new Error("Token generation error");
  }
};

const verifyAccessToken = (
  accessToken: string,
  options?: {
    audience?: string;
    issuer?: string;
    algorithms?: [Algorithm];
  }
): string | JwtPayload => {
  const funcName = `token.service.${verifyAccessToken.name}`;
  try {
    const publicKey = fs.readFileSync(
      path.join(__dirname, "..", "..", "certs", "publicKey.pem")
    );
    return jwt.verify(accessToken, publicKey, options);
  } catch (error) {
    log.error(
      `${funcName}: something went wrong while verifying token with error ${error} `
    );
    return "";
  }
};

export default {
  prepareEndUserTokenResponse,
  verifyAccessToken
};
