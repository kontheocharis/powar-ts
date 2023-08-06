import { runCli } from "powar-ts";
import helloWorld from "./modules/hello-world";

runCli(() => ({
  rootPath: __dirname,
  modules: [
    // Add your modules here:
    helloWorld({}),
  ],
}));
