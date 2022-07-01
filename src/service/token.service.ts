import fs from "fs";
import jwt, { Algorithm, JwtPayload } from "jsonwebtoken";
import path from "path";
import HttpException from "../model/HttpException";
import { ApisDocument } from "../types/ApisModel";

import {
  CreateJWTPayload,
  TokenResponse,
  GrantTypes
} from "../types/TokenModel";
import { UserDocument } from "../types/UsersModel";
import log, { Logger } from "../utils/logger";
import apiService from "./api.service";
import refreshTokenService from "./refreshToken.service";

const JWT_SECRET = fs.readFileSync(
  path.join(__dirname, "..", "..", "certs", "privateKey.pem")
);
const JWT_PUBLIC_KEY = JSON.parse(
  fs
    .readFileSync(
      path.join(__dirname, "..", "..", "public", ".well-known", "jwks.json")
    )
    .toString()
);

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

const getAccessToken = async ({
  grant_type,
  clientId = "",
  scope = "",
  apiDocument,
  user
}: {
  grant_type: GrantTypes;
  clientId: string;
  scope: string;
  apiDocument: ApisDocument;
  user: UserDocument;
}) => {
  const log = new Logger(`token.service.${getAccessToken.name}`);

  try {
    const tokenExpiry =
      apiDocument.tokenExpiry || process.env.JWT_EXPIRTY_IN_SECS || 86400;

    //Authorization code
    if (grant_type === "authorization_code") {
      const payload = {
        sub: String(user._id),
        azp: clientId,
        scope,
        aud: [apiDocument.identifier, `${apiDocument.identifier}/userinfo`]
      };
      return jwt.sign(payload, JWT_SECRET, {
        algorithm: "RS256",
        expiresIn: Number(tokenExpiry),
        issuer: "vs-auth",
        keyid: JWT_PUBLIC_KEY.kid,
        header: { alg: "RS256", kid: JWT_PUBLIC_KEY.kid, typ: "JWT" },
        mutatePayload: true
      });
    }

    //client_credentials

    if (grant_type === "client_credentials") {
      const payload = {
        sub: clientId,
        azp: clientId,
        scope: apiDocument.permissions,
        aud: apiDocument.identifier
      };
      return jwt.sign(payload, JWT_SECRET, {
        algorithm: "RS256",
        expiresIn: Number(tokenExpiry),
        issuer: "vs-auth",
        keyid: JWT_PUBLIC_KEY.kid,
        header: { alg: "RS256", kid: JWT_PUBLIC_KEY.kid, typ: "JWT" },
        mutatePayload: true
      });
    }
  } catch (error) {
    log.error(
      ` Something went wrong while generting access token with error :${error}`
    );
    throw error;
  }
};

const getIDToken = async ({
  clientId = "",
  scope = "",
  apiDocument,
  user
}: {
  clientId: string;
  scope: string;
  apiDocument: ApisDocument;
  user: UserDocument;
}) => {
  const log = new Logger(`token.service.${getIDToken.name}`);
  try {
    const tokenExpiry =
      apiDocument.tokenExpiry || process.env.JWT_EXPIRTY_IN_SECS || 86400;
    const payload = {
      sub: String(user._id),
      azp: clientId,
      "https://vs-auth.com/email": user.email,
      scope,
      aud: [apiDocument.identifier, `${apiDocument.identifier}/userinfo`]
    };
    return jwt.sign(payload, JWT_SECRET, {
      algorithm: "RS256",
      expiresIn: Number(tokenExpiry),
      issuer: "vs-auth",
      keyid: JWT_PUBLIC_KEY.kid,
      header: { alg: "RS256", kid: JWT_PUBLIC_KEY.kid, typ: "JWT" },
      mutatePayload: true
    });
  } catch (error) {
    log.error(
      ` Something went wrong while generting access token with error :${error}`
    );
    throw error;
  }
};

const prepareTokenResponse = async ({
  grant_type,
  user,
  clientId = "",
  scope,
  callbackURL,
  sessionId,
  apiDocument
}: {
  grant_type: GrantTypes;
  user: UserDocument;
  clientId: string;
  scope: string;
  callbackURL: string;
  sessionId: string;
  apiDocument: ApisDocument;
}) => {
  const log = new Logger(`token.service.${prepareTokenResponse}`);
  try {
    let id_token, refresh_token;
    const access_token = await getAccessToken({
      grant_type,
      apiDocument,
      clientId,
      scope,
      user
    });
    log.debug(`generated Access token`);
    if (
      (grant_type === "authorization_code" || grant_type === "refresh_token") &&
      scope.includes("openid")
    ) {
      id_token = await getIDToken({ apiDocument, clientId, scope, user });
      log.debug(`generated ID token`);
    }

    if (scope.includes("offline_access")) {
      const refreshTokenDocument =
        await refreshTokenService.createRefreshTokenDocument({
          clientId,
          payload: JSON.stringify({ callbackURL, userId: user._id || "" }),
          lock: false,
          sessionId
        });
      if (refreshTokenDocument) {
        refresh_token = refreshTokenDocument.refreshToken;
        log.debug(`generated refresh token`);
      }
    }

    return {
      access_token,
      token_type: "Bearer",
      ...(refresh_token ? { refresh_token } : {}),
      ...(id_token ? { id_token } : {}),
      expires_in: apiDocument.tokenExpiry
    };
  } catch (error) {
    log.error(
      `Something went wrong while generting token response with error :${error}`
    );
    throw error;
  }
};

export default {
  prepareEndUserTokenResponse,
  verifyAccessToken,
  prepareTokenResponse
};
