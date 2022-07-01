import { Logger } from "./logger";

const createUrlWithHash = (
  url: string,
  hash: { [key: string]: string | boolean }
) => {
  const logger = new Logger(createUrlWithHash.name);
  try {
    const _url = new URL(url);
    const _hash = Object.keys(hash).reduce(
      (prevVal: string, nextValue: string) => {
        if (prevVal) {
          return `${prevVal}&${nextValue}=${hash[nextValue]}`;
        }
        return `${nextValue}=${hash[nextValue]}`;
      },
      ""
    );
    _url.hash = _url.hash.concat(_hash);
    return _url.href;
  } catch (error) {
    logger.error(
      `Something went wrong while creating url with hash with error: ${error}`
    );
  }
};

export default { createUrlWithHash };
