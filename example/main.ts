import { powar } from "./deps.ts";
import helloWorld from "./modules/hello_world/mod.ts";

powar.runCli(() => ({
  rootPath: powar.dir(import.meta),
  modules: [
    // Add your modules here:
    helloWorld({}),
  ],
}));
