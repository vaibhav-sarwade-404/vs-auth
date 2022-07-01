import "dotenv/config";
import App from "./app";

const _app = new App(Number(process.env.PORT || 3001));
_app.listen();
