import { isObject } from "lodash";
import { GenericObject } from "../types/Generic";
import {
  SchemaValidationRuleProperties,
  SchemaError,
  ValidationRulesSchema
} from "../types/SchemaValidator";
import { SchemaValidationRulePropertiesType } from "./constants";
import genericUtils from "./genericUtils";
import { Logger } from "./logger";
import validations, { isArray, isEmptyObject } from "./validations";

export class SchemaValidationError {
  private errors: SchemaError[];
  constructor() {
    this.errors = [] as SchemaError[];
  }

  public addError(error: SchemaError) {
    this.errors.push(error);
  }

  public addErrors(errors: SchemaError[]) {
    this.errors = [...this.errors, ...errors];
  }

  public getErrors(): SchemaError[] {
    return this.errors;
  }

  public hasSchemaValidationError(): boolean {
    return !!this.errors.length;
  }
}

export class SchemaValidator {
  private allErrors: boolean;
  private schemas: { [key: string]: ValidationRulesSchema };
  private compiledSchemas: { [key: string]: ValidationRulesSchema };
  private static instance: SchemaValidator;
  private constructor({ allErrors }: { allErrors: boolean }) {
    this.allErrors = allErrors;
    this.schemas = {};
    this.compiledSchemas = {};
  }

  public static getInstance({
    allErrors
  }: {
    allErrors?: boolean;
  }): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator({
        allErrors: !!allErrors
      });
    }

    return SchemaValidator.instance;
  }

  public addSchema(name: string, schema: ValidationRulesSchema) {
    this.schemas[name] = schema;
  }

  public validate(name: string, object: GenericObject): SchemaValidationError {
    const log = new Logger(`${SchemaValidator.name}.${this.compile.name}`);
    log.info(`validating object agains schema(${name})`);
    const { properties, required = [] } = this.schemas[name];
    let schemaValidationError = new SchemaValidationError();

    if (!isObject(object)) {
      schemaValidationError.addError({
        field: "payload",
        error: `Payload(${name.split(".").pop()}) should be valid object`
      });
      return schemaValidationError;
    }
    for (const schemaPropertyKey of Object.keys(properties)) {
      if (
        !(schemaPropertyKey in object) &&
        !required.includes(schemaPropertyKey)
      ) {
        continue;
      }
      const { type, validate } = properties[schemaPropertyKey];
      if (type === SchemaValidationRulePropertiesType.Object) {
        const validationResult = this.validate(
          `${name}.${schemaPropertyKey}`,
          genericUtils.getValueFromObject(object, schemaPropertyKey)
        );
        if (validationResult.hasSchemaValidationError()) {
          schemaValidationError.addErrors(validationResult.getErrors());
        }
        continue;
      }
      if (validate) {
        const validationMsg = validate(
          genericUtils.getValueFromObject(object, schemaPropertyKey)
        );
        if (validationMsg) {
          schemaValidationError.addError({
            field: schemaPropertyKey,
            error: validationMsg
          });
          if (!this.allErrors) {
            break;
          }
        }
      }
    }
    return schemaValidationError;
  }

  /**
   * Returns validate function which will take object to validate
   */
  public compile(name: string, _schema?: ValidationRulesSchema): Function {
    const log = new Logger(`${SchemaValidator.name}.${this.compile.name}`);
    log.info(`compiling schema validation for schema(${name})`);
    if (_schema) {
      log.debug(
        `schema was provided to compile function, adding schema to collection, if exist it will be overwritten`
      );
      this.addSchema(name, _schema);
    }
    const schema: ValidationRulesSchema = this.schemas[name];
    if (!schema) {
      log.error(
        `compilation of schema(${name}) failed because no schema found, skipping compilation`
      );
      return () => {};
    }
    if (isEmptyObject(schema)) {
      return (value: GenericObject) => {
        return this.validate(name, value);
      };
    }
    for (const propertyKey of Object.keys(schema.properties)) {
      const {
        type,
        items,
        itemsFrom,
        oneOf,
        customValidator = [],
        nullable = false
      }: SchemaValidationRuleProperties = schema.properties[propertyKey];
      if (type === SchemaValidationRulePropertiesType.Object) {
        const { errorMessage, properties, required } =
          schema.properties[propertyKey];
        this.addSchema(`${name}.${propertyKey}`, {
          type,
          errorMessage,
          properties,
          required
        });
        this.compile(`${name}.${propertyKey}`);
        continue;
      }
      let validators = [] as Function[];
      validators.push(validations.isTypeMatches);
      if (!nullable) {
        validators.push(validations.isNullable);
      }
      if (items) {
        validators.push(validations.isItemsArray);
      }
      if (itemsFrom) {
        validators.push(validations.isArrayWithItemsFrom);
      }
      if (oneOf) {
        validators.push(validations.isValueOneOfArray);
      }
      if (isArray(customValidator)) {
        log.debug(
          `Schema has custom validator function, please note custom functions should return true or false as result in any case. True of successful validation, and false of failed validation`
        );
        validators = validators.concat(customValidator);
      }
      schema.properties[propertyKey].validate = (value: any): string => {
        const isValid = validations.validate(
          propertyKey,
          validators,
          value,
          schema.properties[propertyKey]
        );
        return !isValid ? schema.errorMessage.properties[propertyKey] : "";
      };
    }
    this.compiledSchemas[name] = schema;
    log.info(`compiled schema validation for schema(${name})`);
    return (value: GenericObject) => {
      return this.validate(name, value);
    };
  }
}
