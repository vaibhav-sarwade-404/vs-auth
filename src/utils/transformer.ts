import { Logger } from "./logger";

const numberToCapitalLetter = (num: number | string): string => {
  const logger = new Logger(numberToCapitalLetter.name);
  let string = "";
  try {
    const code = "A".charCodeAt(0);
    string = Array.from(String(num)).reduce(
      (prevVal: string, currentVal: string) =>
        `${prevVal}${String.fromCharCode(code + Number(currentVal))}`,
      ""
    );
  } catch (error) {
    logger.error(
      `something went wrong while conveting numbers to chars with error: ${error}`
    );
  }
  return string;
};

const numberToLowercaseLetter = (num: number | string): string => {
  const logger = new Logger(numberToLowercaseLetter.name);
  let string = "";
  try {
    const code = "a".charCodeAt(0);
    string = Array.from(String(num)).reduce(
      (prevVal: string, currentVal: string) =>
        `${prevVal}${String.fromCharCode(code + Number(currentVal))}`,
      ""
    );
  } catch (error) {
    logger.error(
      `something went wrong while conveting numbers to chars with error: ${error}`
    );
  }
  return string;
};

const capitalLettersToNumber = (str: string): number => {
  const logger = new Logger(capitalLettersToNumber.name);
  let string = "";
  try {
    const code = "A".charCodeAt(0);
    string = Array.from(String(str)).reduce(
      (prevVal: string, currentVal: string) =>
        `${prevVal}${String(currentVal.charCodeAt(0) - code)}`,
      ""
    );
  } catch (error) {
    logger.error(
      `something went wrong while conveting capital letters to numbers with error: ${error}`
    );
  }
  return Number(string);
};

const digitToCapitalLetter = (num: number): string => {
  const logger = new Logger(digitToCapitalLetter.name);
  let string = "";
  try {
    const code = "A".charCodeAt(0);
    return String.fromCharCode(code + num);
  } catch (error) {
    logger.error(
      `something went wrong while conveting numbers to chars with error: ${error}`
    );
  }
  return string;
};

const digitToLowrcaseLetter = (num: number): string => {
  const logger = new Logger(digitToLowrcaseLetter.name);
  let string = "";
  try {
    const code = "a".charCodeAt(0);
    return String.fromCharCode(code + num);
  } catch (error) {
    logger.error(
      `something went wrong while conveting numbers to chars with error: ${error}`
    );
  }
  return string;
};

export default {
  numberToCapitalLetter,
  capitalLettersToNumber,
  numberToLowercaseLetter,
  digitToCapitalLetter,
  digitToLowrcaseLetter
};
