import { module } from "powar-ts";

interface HelloWorldVars {}

export default module(({}: HelloWorldVars) => ({
  name: "hello-world",
  dependsOn: [],
  path: __dirname,
  async action(p) {
    p.info("Hello, world!");
  },
}));
