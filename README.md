# Powar

Powar is a dot-file configuration manager.

Each dot-file setup consists of a TypeScript project that uses the `powar-ts`
library to define a set of **modules**, each corresponding to a configuration
for some program or group of programs. For example, a Powar project might
contain modules `tmux`, `nvim`, `vscode` and `shell-scripts`.

Each of these will install relevant configuration files for each program into
their appropriate places. Furthermore, each module has the full power of
TypeScript along with an API provided by Powar to perform common tasks such as
installing files or running commands.

## Getting started

Requirements: a UNIX system, recent versions of NodeJS and Yarn.

The first step is to install Powar globally:

```sh
$ yarn global add https://github.com/kontheocharis/powar
```

Then, create a new Powar project:

```sh
$ cd ~
$ powar-init --name "dot-files" --path "./dot-files" --author "Gandalf the Grey"
```

This will create a folder `dot-files` containing a NodeJS/TypeScript project.
Run the template Powar project:

```sh
$ cd ./dot-files
$ yarn powar
```

You should see the following output:
```
All module dependencies met.
Running hello-world...
  Hello, world!
Done.
```

This means that the module `hello-world` was run, which logged the message
"Hello, world!".

To add your configurations, start by mirroring the `hello-world` module in
`modules/hello-world/index.ts` to a program of your choice, for example
`modules/nvim/index.ts`. An example configuration for `nvim` might be:
```ts
import { module } from "powar-ts";

interface NvimVars {}

export default module(({}: NvimVars) => ({
  name: "nvim",
  dependsOn: [],
  path: __dirname,
  async action(p) {
    // Assuming there is a file in the current directory named `init.vim`:
    p.install({"init.vim", "$HOME/.config/nvim/init.vim"});
    p.info("Neovim configuration installed.");
  },
}));

```

Then, update the `global.ts` file to register your new module:
```ts
import { runCli } from "powar-ts";
import nvim from "./modules/nvim";

runCli(() => ({
  rootPath: __dirname,
  modules: [
    // Add your modules here:
    nvim({}),
  ],
}));
```

Then, running `yarn powar` should produce:
```
All module dependencies met.
Running nvim ..
  Neovim configuration installed.
Done.
```

## API and command-line arguments

To see all the available command-line arguments for `yarn powar`, run `yarn
powar -h`.

All available API functions provided by `powar-ts` are documented in
[here](https://kontheocharis.github.io/powar-ts).

