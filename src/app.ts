import express from "express";
import path from "path";
import config from "config";
import csurf from "csurf";
import cookieParser from "cookie-parser";

import log from "./utils/logger";
import connect from "./utils/connect";
import routes from "./routes";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, `../.env.common`) });

const port = config.get<number>("port");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csurf({ cookie: true }));

app.listen(port, () => {
  log.info(`App is running at http://localhost:${port}`);
  connect();
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
