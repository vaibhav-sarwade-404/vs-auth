import {
  createCipheriv,
  randomBytes,
  createHash,
  createDecipheriv,
  createHmac
} from "crypto";
import log, { Logger } from "./logger";
import transformer from "./transformer";
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

type RuleName = "uppercase" | "lowercase" | "numbers" | "symbols";

export const generateRandomChars = (
  rules: {
    ruleName: RuleName;
    numberOfChars: number;
  }[]
): string => {
  const log = new Logger(generateRandomChars.name);
  const result = [] as string[];
  try {
    rules.forEach(rule => {
      const { ruleName, numberOfChars } = rule;
      if (ruleName === "uppercase") {
        if (numberOfChars > 25)
          throw new Error(
            `uppercase rule is invalid: cannot generate more that 25 chars with single rule`
          );
        let uppercaseArray = [] as string[];
        let tempIndexArray = [] as number[];
        while (true) {
          const randomInt = Math.floor(Math.random() * 25);
          if (!tempIndexArray.includes(randomInt)) {
            uppercaseArray.push(transformer.digitToCapitalLetter(randomInt));
            tempIndexArray.push(randomInt);
          }
          if (uppercaseArray.length === numberOfChars) break;
        }
        result.push(uppercaseArray.join(""));
      }

      if (ruleName === "lowercase") {
        if (numberOfChars > 25)
          throw new Error(
            `lowercase rule is invalid: cannot generate more that 25 chars with single rule`
          );
        let lowercaseArray = [] as string[];
        let tempIndexArray = [] as number[];

        while (true) {
          const randomInt = Math.floor(Math.random() * 25);
          if (!tempIndexArray.includes(randomInt)) {
            lowercaseArray.push(transformer.digitToLowrcaseLetter(randomInt));
            tempIndexArray.push(randomInt);
          }
          if (lowercaseArray.length === numberOfChars) break;
        }
        result.push(lowercaseArray.join(""));
      }

      if (ruleName === "numbers") {
        let numberArray = [] as number[];
        while (true) {
          const randomInt = Math.floor(Math.random() * 9);
          numberArray.push(randomInt);
          if (numberArray.length === numberOfChars) break;
        }
        result.push(numberArray.join(""));
      }

      if (ruleName === "symbols") {
        let symbolsArray = [] as string[];
        while (true) {
          const symbols = ["-", "_", "+"];
          const randomInt = Math.floor(Math.random() * 2);
          symbolsArray.push(symbols[randomInt]);
          if (symbolsArray.length === numberOfChars) break;
        }
        result.push(symbolsArray.join(""));
      }
    });
  } catch (error) {
    log.error(
      `Something went wrong while generating random chars with error: ${error}`
    );
  }
  return result
    .join("")
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
