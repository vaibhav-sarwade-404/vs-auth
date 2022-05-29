import dotenv from "dotenv";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import ConnectMongoDBSession from "connect-mongodb-session";

dotenv.config({ path: path.join(__dirname, `../.env.common`) });

import connect from "./utils/connect";
import routes from "./routes";
import logMiddleware from "./middleware/log.middleware";
import log from "./utils/logger";

const port = process.env.PORT || 3001;
const connectionString: string = process.env.DB_URL || "";

const MongoDBStore = ConnectMongoDBSession(session);
const mongoStore = new MongoDBStore({
  uri: connectionString,
  collection: "sessions"
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
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

app.use(logMiddleware);

app.listen(port, () => {
  log.info(`App is running at http://localhost:${port}`);
  connect(connectionString);
  routes(app);
});

/**
 * Add event handler for unhandledRejection to log
 */
process.on("unhandledRejection", (reason: any) => {
  log.error(`Unhandled Rejection at: ${reason.stack || reason}`);
});

/**
 * Add event handler for generic unhandled errors to log
 * Should be countered by ErrorHandlerMiddlerware
 */
process.on("error", reason => {
  log.error(`Unhandled Rejection at: ${reason.stack || reason}`);
});
