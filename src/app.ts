import express, { Application } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import ConnectMongoDBSession from "connect-mongodb-session";
import mongoose from "mongoose";

import logMiddleware from "./middleware/log.middleware";
import errorHandlerMiddlerware from "./middleware/error.middleware";
import { Logger } from "./utils/logger";
import Routes from "./routes";
import { SchemaValidator } from "./utils/SchemaValidator";
import constants from "./utils/constants";
import genericUtils from "./utils/genericUtils";

class App {
  public express: Application;
  public port: number;
  private dbConnectionStatus: boolean;

  constructor(port: number) {
    this.express = express();
    this.port = port;
    this.dbConnectionStatus = false;
    this.initDatabase();
    this.initMiddlware();
    this.initRoutes();
    this.initErrorHandling();
    this.initSchemaValidator();
  }

  private initMiddlware(): void {
    const logger = new Logger(`App.${this.initMiddlware.name}`);
    this.express.disable("x-powered-by");
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(cookieParser());
    this.initSessionManagement();
    this.express.use(express.static("public"));
    this.express.use(logMiddleware);
    logger.info(`Middleware initialized`);
  }

  private initRoutes(): void {
    const logger = new Logger(`App.${this.initMiddlware.name}`);
    this.express.use(new Routes().router);
    logger.info(`Routes initialized`);
  }

  private initErrorHandling(): void {
    const logger = new Logger(`App.${this.initMiddlware.name}`);
    this.express.use(errorHandlerMiddlerware);
    logger.info(`Error handling initialized`);
  }

  private initDatabase(): void {
    const logger = new Logger(`App.${this.initMiddlware.name}`);
    mongoose.set(
      "debug",
      (process.env.MONGO_DEBUG || "").toLowerCase() === "true"
    );
    mongoose
      .connect(process.env.DB_URL || "")
      .then(() => {
        logger.info(`DB connected`);
        this.dbConnectionStatus = true;
      })
      .catch(err => {
        logger.error(`Couldn't connect to DB, exiting with error: ${err}`);
        process.exit(1);
      });
    logger.info(`DB initialized`);
  }

  private initSessionManagement(): void {
    const logger = new Logger(`App.${this.initMiddlware.name}`);
    const MongoDBStore = ConnectMongoDBSession(session);
    const mongoStore = new MongoDBStore({
      uri: process.env.DB_URL || "",
      collection: "sessions"
    });
    this.express.use(
      session({
        secret: String(
          process.env.SESSION_ENCRYPTION_KEY || "DEFAULT_SECRET"
        ).split(","),
        resave: false,
        saveUninitialized: true,
        store: mongoStore,
        name: "vs-auth"
      })
    );
    logger.info(`Session management initialized`);
  }

  private initSchemaValidator(): void {
    const logger = new Logger(`App.${this.initSchemaValidator.name}`);
    const schema = SchemaValidator.getInstance({ allErrors: true });
    const { validationSchemas } = constants;
    for (const schemaName of Object.keys(validationSchemas)) {
      schema.addSchema(
        schemaName,
        genericUtils.getValueFromObject(validationSchemas, schemaName)
      );
      schema.compile(schemaName);
    }

    logger.info(`Schema validator initialized`);
  }

  public listen(): void {
    const logger = new Logger(`App.${this.listen.name}`);
    const retryTimer = setInterval(() => {
      if (this.dbConnectionStatus) {
        this.express.listen(this.port, () => {
          logger.info(
            `DB is connected, App is running at http://localhost:${this.port}`
          );
        });
        clearTimeout(retryTimer);
      }
      logger.info(`DB is not yet connected, retrying in 1 sec`);
    }, 100);
  }
}

export default App;
