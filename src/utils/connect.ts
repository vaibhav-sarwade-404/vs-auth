import mongoose from "mongoose";

import log from "./logger";

const connect = (connectionString: string) => {
  const funcName = connect.name;

  mongoose
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
