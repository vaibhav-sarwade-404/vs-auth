import { ValidationRulesSchema } from "../types/SchemaValidator";

const ERROR_STRINGS = {
  missingRequiredParameter: "Missing required parameter",
  callbackMismatch: "Callback mismatch",
  unsupportedResponseType: "Unsupported response type",
  unknownClient: "Unknown Client",
  invalidState: "Invalid state",
  notFound: "Not found",
  invalidAudience: "Invalid audience",
  invalidRequest: "Invalid request"
};

const LOG_LEVEL = {
  info: "info",
  debug: "debug",
  warn: "warn",
  error: "error"
};

const CONSOLE_COLORS = {
  red: `\u001b[31m`,
  green: `\u001b[32m`,
  yellow: `\u001b[33m`,
  cyan: `\u001b[36m`,
  white: `\u001b[37m`,
  reset: `\u001b[0m`
};

const LOG_LEVEL_COLOR = {
  [LOG_LEVEL.info]: CONSOLE_COLORS.white,
  [LOG_LEVEL.debug]: CONSOLE_COLORS.white,
  [LOG_LEVEL.warn]: CONSOLE_COLORS.yellow,
  [LOG_LEVEL.error]: CONSOLE_COLORS.red
};

const COLlECTIONS = {
  users: "users",
  state: "state",
  tenant: "tenant",
  clients: "clients",
  pages: "pages",
  cleanup: "cleanup",
  authorizationCode: "authorizationCode",
  refreshToken: "refreshToken",
  logs: "logs",
  loginRateLimit: "loginRateLimit",
  userInfoRateLimit: "userInfoRateLimit",
  apis: "APIs",
  ticket: "ticket",
  forgotPasswordRateLimit: "forgotPasswordRateLimit",
  emails: "emails"
};

const RATE_LIMIT_KEYS = {
  loginApi: `login_`,
  userInfoApi: `userInfo_`,
  failedEmailPasswordLogin: `fl_`,
  forgotPassword: "forgotPass_"
};

const EMAIL_ACTION_ROUTES = {
  VERIFY_EMAIL: "/u/verify-email/",
  PASSWORD_RESET_EMAIL: "/u/password-reset/",
  BLOCKED_ACCOUNT_EMAIL: "/u/unblock/"
};

const CLIENT_DEFAULT_VALUES = {
  common: {
    idTokenExpiry: 36000,
    refreshTokenRotation: true,
    refreshTokenExpiry: 31536000,
    grantTypes: ["authorization_code", "refresh_token"],
    api: {},
    allowedCallbackUrls: [],
    allowedLogoutUrls: []
  },
  spa: {
    idTokenExpiry: 36000,
    refreshTokenRotation: true,
    refreshTokenExpiry: 31536000,
    grantTypes: ["authorization_code", "refresh_token"],
    api: {},
    allowedCallbackUrls: [],
    allowedLogoutUrls: []
  },
  m2m: {
    idTokenExpiry: 0,
    refreshTokenRotation: false,
    refreshTokenExpiry: 0,
    grantTypes: [
      "authorization_code",
      "refresh_token",
      "client_credentials",
      "password"
    ],
    allowedCallbackUrls: [],
    allowedLogoutUrls: []
  }
};

const GRANT_TYPES = [
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "password"
];

const PERMISSIONS = [
  "users:read",
  "users:create",
  "users:update",
  "users:delete",
  "applications:create",
  "applications:read",
  "applications:update",
  "applications:delete",
  "logs:read",
  "logs:delete"
];

//If update required, make sure it is updated in SchemaValidator.d.ts
export const SchemaValidationRulePropertiesType = {
  Array: "Array",
  String: "String",
  Boolean: "Boolean",
  Number: "Number",
  Object: "Object",
  Email: "Email",
  Password: "Password",
  Url: "Url"
};

//If update required, make sure it is updated in SchemaValidator.d.ts
export const SchemaValidationRulePropertiesItems = {
  String: "String",
  Number: "Number",
  Url: "Url"
};

export const ApplicationTypes = {
  m2m: "m2m",
  spa: "spa"
};

export const GrantTypes = {
  authorization_code: "authorization_code",
  refresh_token: "refresh_token",
  client_credentials: "client_credentials"
};

export const PageNames = {
  login: "login",
  error: "error",
  password_reset: "password_reset"
};

export const validationSchemaNames = {
  updateClient: "updateClient",
  createM2MClient: "createM2MClient",
  createClient: "createClient",
  updatePage: "updatePage",
  updateUser: "updateUser",
  createUser: "createUser",
  authorizeCodeGrantExchange: "authorizeCodeGrantExchange",
  refreshTokenGrantExchange: "refreshTokenGrantExchange",
  clientCredentialGrantExchange: "clientCredentialGrantExchange"
};

const validationSchemas = {
  [validationSchemaNames.updateClient]: {
    type: "Object",
    properties: {
      allowedCallbackUrls: {
        type: SchemaValidationRulePropertiesType.Array,
        items: SchemaValidationRulePropertiesItems.Url
      },
      allowedLogoutUrls: {
        type: SchemaValidationRulePropertiesType.Array,
        items: SchemaValidationRulePropertiesItems.Url
      },
      idTokenExpiry: {
        type: SchemaValidationRulePropertiesType.Number
      },
      refreshTokenRotation: {
        type: SchemaValidationRulePropertiesType.Boolean
      },
      refreshTokenExpiry: {
        type: SchemaValidationRulePropertiesType.Number
      },
      grantTypes: {
        type: SchemaValidationRulePropertiesType.Array,
        items: SchemaValidationRulePropertiesItems.String,
        itemsFrom: GRANT_TYPES
      },
      clientName: {
        type: SchemaValidationRulePropertiesType.String
      },
      api: {
        type: SchemaValidationRulePropertiesType.Object,
        properties: {
          apiId: { type: SchemaValidationRulePropertiesType.String },
          scopes: {
            type: SchemaValidationRulePropertiesType.Array,
            items: SchemaValidationRulePropertiesItems.String,
            itemsFrom: PERMISSIONS
          }
        },
        required: ["apiId", "scopes"],
        errorMessage: {
          type: "api should be an object",
          properties: {
            apiId: "api.apiId should be a valid String",
            scopes:
              "api.scopes should be Array of valid scopes / permissions, look at API's available scopes"
          }
        }
      }
    },
    required: [],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        allowedCallbackUrls:
          "allowedCallbackUrls should be Array of valid URL's",
        allowedLogoutUrls: "allowedLogoutUrls should be Array of valid URL's",
        idTokenExpiry: "idTokenExpiry should be Number, greater than 0",
        refreshTokenRotation: "refreshTokenRotation should be Boolean",
        refreshTokenExpiry:
          "refreshTokenExpiry should be Number, greater than 0",
        grantTypes:
          "grantTypes should be Array of valid scopes / permissions, look at API's available scopes",
        clientName: "clientName should be a valid String"
      }
    }
  },
  [validationSchemaNames.createM2MClient]: {
    type: "Object",
    properties: {
      applicationType: {
        type: SchemaValidationRulePropertiesType.String,
        oneOf: [ApplicationTypes.m2m]
      },
      clientName: {
        type: SchemaValidationRulePropertiesType.String
      },
      api: {
        type: SchemaValidationRulePropertiesType.Object,
        properties: {
          apiId: { type: SchemaValidationRulePropertiesType.String },
          scopes: {
            type: SchemaValidationRulePropertiesType.Array,
            items: SchemaValidationRulePropertiesItems.String,
            itemsFrom: PERMISSIONS
          }
        },
        required: ["apiId", "scopes"],
        errorMessage: {
          type: "api should be an object",
          properties: {
            apiId: "api.apiId should be a valid String",
            scopes:
              "api.scopes should be Array of valid scopes / permissions, look at API's available scopes"
          }
        }
      }
    },
    required: [],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        clientName: "clientName should be a valid String",
        applicationType: "applicationType is invalid"
      }
    }
  },
  [validationSchemaNames.createClient]: {
    type: "Object",
    properties: {
      applicationType: {
        type: SchemaValidationRulePropertiesType.String,
        oneOf: [ApplicationTypes.spa]
      },
      clientName: {
        type: SchemaValidationRulePropertiesType.String
      }
    },
    required: [],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        clientName: "clientName should be a valid String",
        applicationType: "applicationType is invalid"
      }
    }
  },
  [validationSchemaNames.updatePage]: {
    type: "Object",
    properties: {
      page: {
        type: SchemaValidationRulePropertiesType.String,
        oneOf: Object.values(PageNames)
      },
      html: {
        type: SchemaValidationRulePropertiesType.String
      }
    },
    required: ["page", "html"],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        page: `page should be a valid from ${JSON.stringify(
          Object.keys(PageNames)
        )}, values should match in body and path param`,
        html: "html should be valid string"
      }
    }
  },
  [validationSchemaNames.updateUser]: {
    type: "Object",
    properties: {
      email: {
        type: SchemaValidationRulePropertiesType.Email
      },
      email_verified: {
        type: SchemaValidationRulePropertiesType.Boolean
      },
      password: {
        type: SchemaValidationRulePropertiesType.Password,
        passwordRules: {
          minLength: 8,
          pointsForContainingLower: 1,
          pointsForContainingUpper: 1,
          pointsForContainingNumber: 1,
          pointsForContainingSymbol: 1
        }
      },
      user_metadata: {
        type: "Object",
        properties: {
          firstName: {
            type: SchemaValidationRulePropertiesType.String
          },
          lastName: {
            type: SchemaValidationRulePropertiesType.String
          }
        },
        required: [],
        errorMessage: {
          type: "payload should be an object",
          properties: {
            firstName: "firstName should be valid string",
            lastName: "lastName should be a valid string"
          }
        }
      }
    },
    required: [],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        email: "email should be valid",
        email_verified: "email_verified should be boolean",
        password: `strong password is required, with required password policy`
      }
    }
  },
  [validationSchemaNames.createUser]: {
    type: "Object",
    properties: {
      email: {
        type: SchemaValidationRulePropertiesType.Email
      },
      email_verified: {
        type: SchemaValidationRulePropertiesType.Boolean
      },
      password: {
        type: SchemaValidationRulePropertiesType.Password,
        passwordRules: {
          minLength: 8,
          pointsForContainingLower: 1,
          pointsForContainingUpper: 1,
          pointsForContainingNumber: 1,
          pointsForContainingSymbol: 1
        }
      },
      user_metadata: {
        type: "Object",
        properties: {
          firstName: {
            type: SchemaValidationRulePropertiesType.String
          },
          lastName: {
            type: SchemaValidationRulePropertiesType.String
          }
        },
        required: ["firstName", "lastName"],
        errorMessage: {
          type: "payload should be an object",
          properties: {
            firstName: "firstName should be valid string",
            lastName: "lastName should be a valid string"
          }
        }
      }
    },
    required: ["email", "email_verified", "password"],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        email: "email should be valid",
        email_verified: "email_verified should be boolean",
        password: `strong password is required, with required password policy`
      }
    }
  },
  [validationSchemaNames.authorizeCodeGrantExchange]: {
    type: "Object",
    properties: {
      grant_type: {
        type: SchemaValidationRulePropertiesType.String,
        equals: GrantTypes.authorization_code
      },
      client_id: {
        type: SchemaValidationRulePropertiesType.String
      },
      code_verifier: {
        type: SchemaValidationRulePropertiesType.String,
        nullable: true
      },
      code: {
        type: SchemaValidationRulePropertiesType.String
      },
      redirect_uri: {
        type: SchemaValidationRulePropertiesType.Url
      },
      scope: {
        type: SchemaValidationRulePropertiesType.String
      }
    },
    required: ["grant_type", "client_id", "code", "redirect_uri", "scope"],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        grant_type: "grant_type should be a valid string",
        client_id: "client_id should be a valid string",
        code_verifier: `code_verifier should be a valid string`,
        code: `code should be a valid string`,
        redirect_uri: `redirect_uri should be a valid URL`,
        scope: `scope should be a valid string`
      }
    }
  },
  [validationSchemaNames.refreshTokenGrantExchange]: {
    type: "Object",
    properties: {
      grant_type: {
        type: SchemaValidationRulePropertiesType.String,
        equals: GrantTypes.refresh_token
      },
      client_id: {
        type: SchemaValidationRulePropertiesType.String
      },
      refresh_token: {
        type: SchemaValidationRulePropertiesType.String
      },
      redirect_uri: {
        type: SchemaValidationRulePropertiesType.String
      },
      scope: {
        type: SchemaValidationRulePropertiesType.String
      }
    },
    required: [
      "grant_type",
      "client_id",
      "refresh_token",
      "redirect_uri",
      "scope"
    ],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        grant_type: "grant_type should be a valid string",
        client_id: "client_id should be a valid string",
        refresh_token: `refresh_token should be a valid string`,
        redirect_uri: `redirect_uri should be a valid URL`,
        scope: `scope should be a valid string`
      }
    }
  },
  [validationSchemaNames.clientCredentialGrantExchange]: {
    type: "Object",
    properties: {
      grant_type: {
        type: SchemaValidationRulePropertiesType.String,
        equals: GrantTypes.client_credentials
      },
      client_id: {
        type: SchemaValidationRulePropertiesType.String
      },
      client_secret: {
        type: SchemaValidationRulePropertiesType.String
      },
      audience: {
        type: SchemaValidationRulePropertiesType.String
      }
    },
    required: ["grant_type", "client_id", "client_secret", "audience"],
    errorMessage: {
      type: "payload should be an object",
      properties: {
        grant_type: "grant_type should be a valid string",
        client_id: "client_id should be a valid string",
        client_secret: `client_secret should be a valid string`,
        audience: `audience should be a valid string`
      }
    }
  }
};

export default {
  ERROR_STRINGS,
  LOG_LEVEL,
  CONSOLE_COLORS,
  LOG_LEVEL_COLOR,
  COLlECTIONS,
  RATE_LIMIT_KEYS,
  EMAIL_ACTION_ROUTES,
  CLIENT_DEFAULT_VALUES,
  GRANT_TYPES,
  PERMISSIONS,
  validationSchemas,
  validationSchemaNames
};
