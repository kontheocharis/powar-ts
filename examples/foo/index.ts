import { runCli } from "powar-ts";
import simple from "./simple";

runCli(() => ({
  rootPath: __dirname,
  modules: [simple({ extra: "ha" })],
}));
