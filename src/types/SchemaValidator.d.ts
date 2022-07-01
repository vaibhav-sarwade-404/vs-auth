//If update required, make sure it is updated in constants
const _SchemaValidationRulePropertiesType = {
  Array: "Array",
  String: "String",
  Boolean: "Boolean",
  Number: "Number",
  Object: "Object",
  Email: "Email",
  Password: "Password"
};

//If update required, make sure it is updated in constants
const _SchemaValidationRulePropertiesItems = {
  String: "String",
  Number: "Number",
  Url: "Url"
};

export type SchemaValidationRulePropertiesType =
  keyof _SchemaValidationRulePropertiesType;

export type SchemaValidationRulePropertiesItems =
  keyof _SchemaValidationRulePropertiesItems;

export type StrongPasswordOptions = {
  minLength?: number | undefined;
  minLowercase?: number | undefined;
  minUppercase?: number | undefined;
  minNumbers?: number | undefined;
  minSymbols?: number | undefined;
  returnScore?: boolean | undefined;
  pointsPerUnique?: number | undefined;
  pointsPerRepeat?: number | undefined;
  pointsForContainingLower?: number | undefined;
  pointsForContainingUpper?: number | undefined;
  pointsForContainingNumber?: number | undefined;
  pointsForContainingSymbol?: number | undefined;
};

export type SchemaValidationRuleProperties = {
  type: SchemaValidationRulePropertiesType;
  items?: SchemaValidationRulePropertiesItems;
  nullable?: boolean;
  itemsFrom?: string[] | number[];
  validate?: function;
  oneOf?: string[] | number[];
  customValidator: Function[];
  passwordRules: StrongPasswordOptions;
  [key: string]: any;
};

export type SchemaValidationErrorMessage = {
  type: string;
  properties: {
    [key: string]: string;
  };
};

export type ValidationRulesSchema = {
  type: string;
  properties: { [key: string]: SchemaValidationRuleProperties };
  required?: string[];
  errorMessage: SchemaValidationErrorMessage;
};

export type SchemaError = {
  field: string;
  error: string;
};
