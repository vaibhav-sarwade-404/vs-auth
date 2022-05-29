import {
  createCipheriv,
  randomBytes,
  createHash,
  createDecipheriv,
  createHmac
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

export const createSHA256 = (text: string = "") => {
  return toStringUrlSafeBase64(
    createHash("sha256").update(Buffer.from(text)).digest("base64")
  );
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
  str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

export const toBase64 = (str: string): string =>
  Buffer.from(str).toString("base64");

export const customEncode = (base64edString: string = "") =>
  base64edString.replace(/\//g, "-").replace(/\+/g, "_").replace(/=/g, "~");

export const customDecode = (base64edString: string = "") =>
  base64edString.replace(/-/g, "/").replace(/_/g, "+").replace(/~/g, "=");

export const encrypt = (
  text: string,
  key: string,
  encoding: BufferEncoding
): string => {
  const funcName = encrypt.name;
  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return customEncode(
      `${iv.toString("base64")}.${encrypted.toString(encoding)}`
    );
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while encryption with error: ${error}`
    );
    return text;
  }
};

export const decrypt = (
  hash: string,
  key: string,
  encoding: BufferEncoding
): string => {
  const [iv, encrypted] = customDecode(hash).split(".");
  const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, "base64"));
  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, encoding)),
    decipher.final()
  ]);
  return decrpyted.toString();
};

export const generateHMAC = (text: string, secret: string): string => {
  const funcName = generateHMAC.name;
  try {
    return createHmac("sha256", secret)
      .update(text)
      .digest("base64")
      .replace(/\=+$/, "");
  } catch (error) {
    log.error(
      `${funcName}: Something went wrong while generating HMAC with error: ${error}`
    );
    return text;
  }
};
