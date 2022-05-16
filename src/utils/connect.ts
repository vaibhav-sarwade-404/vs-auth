import mongoose from "mongoose";

import log from "./logger";

const connect = () => {
  const funcName = connect.name;

  const connectionString: string = process.env.DB_URL || "";
  return mongoose
    .connect(connectionString)
    .then(() => log.info(`${funcName}: DB connected`))
    .catch(err => {
      log.error(
        `${funcName}: Couldn't connect to DB, exiting with error: ${err}`
      );
      process.exit(1);
    });
};

export default connect;
