import { module } from "powar-ts";

interface SimpleVars {
  extra: string;
}

export default module(({ extra }: SimpleVars) => ({
  name: "simple",
  dependsOn: [],
  path: __dirname,
  async action(p) {
    p.info("Hello, world!");
    await p.install({
      "./test1.txt": "./test-dest/1.txt",
    });
    await p.installContents([["Use the force luke", "./test-dest/2.txt"]]);
    await p.link({
      "./test-dest/2.txt": "./test-dest/3.txt",
    });
    await p.makeDir("./test-dest/4");
    const result = await p.read("./test-dest/2.txt");
    p.info(`'${result.stdoutAsString()}' == 'Use the force luke'`);
    await p.exec(`echo 'hello world ${extra}' > ./test-dest/5.txt`);
  },
}));
