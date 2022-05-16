import constants from "../utils/constants";
import cleanupService from "./cleanup.service";
import pageService from "./page.service";

export default {
  [constants.COLlECTIONS.cleanup]: cleanupService,
  [constants.COLlECTIONS.pages]: pageService,
  [constants.COLlECTIONS.state]: stateService
};
