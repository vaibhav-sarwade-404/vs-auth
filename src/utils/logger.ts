import config from "config";
import dayjs from "dayjs";

import constants from "./constants";

const logLevel: string = config.get("logLevel") || "info";
const { CONSOLE_COLORS, LOG_LEVEL_COLOR, LOG_LEVEL } = constants;

const formatMsg = (
  msg: string,
  msgColor: string = LOG_LEVEL_COLOR[LOG_LEVEL.info]
) => {
  //prettier-ignore
  msg = `[${dayjs().format()}] ${CONSOLE_COLORS.green}${logLevel.toUpperCase()}${CONSOLE_COLORS.reset}: ${msgColor}${msg}${CONSOLE_COLORS.reset}`;
  return msg;
};

const log = {
  info: (msg: string) => console.log(formatMsg(msg)),
  warn: (msg: string) => console.warn(formatMsg(msg, CONSOLE_COLORS.yellow)),
  error: (msg: string) => console.error(formatMsg(msg, CONSOLE_COLORS.red)),
  debug: (msg: string) => {
    if (logLevel?.toLowerCase() !== LOG_LEVEL.debug) return;
    console.log(formatMsg(msg));
  }
};

export default log;
