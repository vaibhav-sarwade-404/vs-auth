import isEmail from "validator/lib/isEmail";
import isStrongPassword from "validator/lib/isStrongPassword";

import { Logger } from "./logger";
import { SchemaValidationRuleProperties } from "../types/SchemaValidator";

const fileName = "validations";

export const isValidEmail = (email: string) => isEmail(email);

export const isTypeMatches = (
  value: any,
  type: string,
  validationRule?: SchemaValidationRuleProperties
): boolean => {
  if (type === "Url") {
    return isValidUrl(value);
  }
  if (type === "Email") {
    return isValidEmail(value);
  }
  if (type === "Password") {
    return isStrongPassword(value, validationRule?.passwordRules || {});
  }
  return Object.prototype.toString.call(value) === `[object ${type}]`;
};

export const isBoolean = (value: any): boolean =>
  isTypeMatches(value, "Boolean");
export const isObject = (value: any): boolean => isTypeMatches(value, "Object");
export const isString = (value: any): boolean => isTypeMatches(value, "String");
export const isNumber = (value: any): boolean => isTypeMatches(value, "Number");
export const isArray = (value: any): boolean => isTypeMatches(value, "Array");
export const isUndefined = (value: any): boolean =>
  isTypeMatches(value, "Undefined");
export const isNull = (value: any): boolean => isTypeMatches(value, "Null");
export const isValidUrl = (url: any): boolean => {
  const log = new Logger(isValidUrl.name);
  try {
    new URL(url);
    return true;
  } catch (error) {
    log.info(
      `Provided URL is not URL or Something went wrong while checking URL with error: ${error}`
    );
  }
  return false;
};

export const isEmptyObject = (obj: object) =>
  JSON.stringify({}) === JSON.stringify(obj);

export const isNullable = (value: any, nullable: boolean): boolean => {
  if (nullable) {
    return true;
  }
  if (isBoolean(value)) {
    return value;
  }
  if (isObject(value)) {
    return !isEmptyObject(value);
  }
  if (isNumber(value)) {
    return value > 0;
  }
  return !!value;
};

export const isItemsArray = (array: any[], itemType: string): boolean => {
  if (!isArray(array)) {
    return false;
  }
  return array.every(arrayEle => isTypeMatches(arrayEle, itemType));
};

export const isArrayWithItemsFrom = (
  array: any[],
  validateAgainstArray: any[]
): boolean => {
  if (!isArray(array)) {
    return false;
  }
  const ele = array.findIndex(arrayEle =>
    validateAgainstArray.includes(arrayEle)
  );
  return ele > -1;
};

export const isValueOneOfArray = (
  value: any,
  validateAgainstArray: any[]
): boolean => {
  const ele = validateAgainstArray.findIndex(arrayEle => arrayEle === value);
  return ele > -1;
};

export const validate = (
  propertyKey: string,
  validators: Function[],
  value: any,
  validationRule: SchemaValidationRuleProperties
) => {
  const log = new Logger(`${fileName}.${validate.name}`);
  log.debug(`validating for ${propertyKey} with value as ${value}`);
  let isValid = true;
  const { type, nullable, items, itemsFrom, oneOf } = validationRule;
  for (const validationFunction of validators) {
    let funcResult = false;
    switch (validationFunction.name) {
      case isTypeMatches.name:
        funcResult = validationFunction(value, type, validationRule);
        log.debug(
          `${isTypeMatches.name} validation result for ${propertyKey} is ${funcResult}`
        );
        break;
      case isNullable.name:
        funcResult = validationFunction(value, nullable);
        log.debug(
          `${isNullable.name} validation result for ${propertyKey} is ${funcResult}`
        );
        break;
      case isItemsArray.name:
        funcResult = validationFunction(value, items);
        log.debug(
          `${isItemsArray.name} validation result for ${propertyKey} is ${funcResult}`
        );
        break;
      case isArrayWithItemsFrom.name:
        funcResult = validationFunction(value, itemsFrom);
        log.debug(
          `${isArrayWithItemsFrom.name} validation result for ${propertyKey} is ${funcResult}`
        );
        break;
      case isValueOneOfArray.name:
        funcResult = validationFunction(value, oneOf);
        log.debug(
          `${isValueOneOfArray.name} validation result for ${propertyKey} is ${funcResult}`
        );
        break;
      default:
        log.debug(
          `${validationFunction.name}: is not one of the inbuild supported validations, so executing function with provided function.`
        );
        funcResult = validationFunction(value, validationRule);
        log.debug(
          `${isArrayWithItemsFrom.name} validation result for ${propertyKey} is ${funcResult}`
        );
        break;
    }
    if (!funcResult) {
      isValid = funcResult;
      break;
    }
  }
  log.debug(
    `validation complete, value for ${propertyKey} is ${
      isValid ? "valid" : "invalid"
    }`
  );
  return isValid;
};

export default {
  isBoolean,
  isObject,
  isString,
  isNumber,
  isNullable,
  isEmptyObject,
  isTypeMatches,
  isItemsArray,
  isArrayWithItemsFrom,
  validate,
  isValueOneOfArray
};
