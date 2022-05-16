import {
  createCipheriv,
  randomFillSync,
  randomBytes,
  createHash
} from "crypto";
import log from "./logger";
const algorithm = "aes-192-cbc";

type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "base64url"
  | "latin1"
  | "binary"
  | "hex";

export const hash = (text: string = "") => {
  return toStringUrlSafeBase64(
    createHash("sha1").update(text, "ascii").digest("base64")
  );
};

export const createCipher = async (
  text: string,
  key: string,
  encoding: BufferEncoding
): Promise<string> => {
  const funcName = createCipher.name;
  try {
    const iv = randomFillSync(new Uint8Array(16));
    const cipher = createCipheriv(algorithm, key, iv);
    return toStringUrlSafeBase64(
      `${cipher.update(text, "utf-8", encoding)}${cipher.final(encoding)}`
    );
  } catch (error) {
    log.error(`${funcName}: Encryption failed, returning same text`);
    return text;
  }
};

export const generateRandomString = async () => {
  const funcName = generateRandomString.name;
  try {
    return randomBytes(12).toString("hex");
  } catch (error) {
    log.error(`${funcName}: Encryption failed, returning same text`);
    return (Math.random() + 1).toString(36).substring(7);
  }
};

export const toStringUrlSafeBase64 = (str: string): string =>
  str.replace(/\//g, "-").replace(/\+/g, "_").replace(/=/g, "");

export const toBase64 = (str: string): string =>
  Buffer.from(str).toString("base64");
