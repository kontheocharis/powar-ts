import { powar } from "../../deps.ts";

export default powar.module(() => ({
  name: "hello_world",
  dependsOn: [],
  path: powar.dir(import.meta),
  action(p) {
    p.info("Hello, world!");
    return Promise.resolve();
  },
}));
