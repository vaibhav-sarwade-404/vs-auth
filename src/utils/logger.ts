import dayjs from "dayjs";

import constants from "./constants";

const logLevel: string = process.env.LOG_LEVEL || "info";
const { CONSOLE_COLORS, LOG_LEVEL_COLOR, LOG_LEVEL } = constants;

const formatMsg = (
  msg: string,
  _logLevel = logLevel,
  msgColor: string = LOG_LEVEL_COLOR[LOG_LEVEL.info]
) => {
  //prettier-ignore
  msg = `[${dayjs().format()}] ${CONSOLE_COLORS.green}${_logLevel.toUpperCase()}${CONSOLE_COLORS.reset}: ${msgColor}${msg}${CONSOLE_COLORS.reset}`;
  return msg;
};

const log = {
  info: (msg: string) => console.log(formatMsg(msg, LOG_LEVEL.info)),
  warn: (msg: string) =>
    console.warn(formatMsg(msg, LOG_LEVEL.warn, CONSOLE_COLORS.yellow)),
  error: (msg: string) =>
    console.error(formatMsg(msg, LOG_LEVEL.error, CONSOLE_COLORS.red)),
  debug: (msg: string) => {
    if (logLevel?.toLowerCase() !== LOG_LEVEL.debug) return;
    console.log(formatMsg(msg));
  }
};

export default log;
