import { JSDOM } from "jsdom";
import {
  LoginPageConfig,
  PasswordResetConfig
} from "../types/LoginPageInjectConfig";
import { PageDocument } from "../types/PagesModel";

import { toBase64 } from "../utils/crypto";

const parseDocAndInjectDataConfig = (
  page: PageDocument,
  objectToInject: LoginPageConfig | PasswordResetConfig
): string => {
  const dom = new JSDOM(page.html);
  const scriptEle = dom.window.document.createElement("script");
  scriptEle.setAttribute("id", "vs-auth-config");
  scriptEle.setAttribute(
    "data-config",
    toBase64(JSON.stringify(objectToInject))
  );
  scriptEle.setAttribute("type", "application/json");
  dom.window.document.head.appendChild(scriptEle);
  return dom.serialize();
};

export default {
  parseDocAndInjectDataConfig
};
