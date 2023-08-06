# Powar

Powar is a dot-file configuration manager.

Each dot-file setup consists of a TypeScript project that uses the `powar` Deno
library to define a set of **modules**, each corresponding to a configuration
for some program or group of programs. For example, a Powar project might
contain modules `tmux`, `nvim`, `vscode` and `shell_scripts`.

Each of these will install relevant configuration files for each program into
their appropriate places. Furthermore, each module has the full power of
TypeScript along with an API provided by Powar to perform common tasks such as
installing files or running commands.

## Getting started

Requirements: a UNIX system, recent versions of NodeJS and Yarn.

The first step is to install `powar_init` globally with Deno:

```sh
$ deno install --allow-read --allow-run https://github.com/kontheocharis/powar/powar_init.ts
```

Then, create a new Powar project (where `powar_init` should be replaced by the
full installation path printed by the command above, if Deno is not in your
`PATH`):

```sh
$ cd ~
$ powar_init --path ./dot_files
```

This will create a folder `dot_files` containing a Deno project. Run the
template Powar project by:

```sh
$ cd dot_files
$ deno run main.ts
```

You should see the following output:

```
All module dependencies met.
Running hello_world...
  Hello, world!
Done.
```

This means that the module `hello_world` was run, which logged the message
"Hello, world!".

To add your configurations, start by mirroring the `hello_world` module in
`modules/hello_world/mod.ts` to a program of your choice, for example
`modules/nvim/mod.ts`. An example configuration for `nvim` might be:

```ts
import { powar } from "../../deps.ts";

export default powar.module(() => ({
  name: "nvim",
  dependsOn: [],
  path: powar.dir(import.meta),
  async action(p) {
    await p.install({"init.vim", "$HOME/.config/nvim/init.vim"});
    p.info("Neovim configuration installed.");
  },
}));
```

Then, update the `global.ts` file to register your new module:
```ts
import { powar } from "./deps.ts";
import nvim from "./modules/nvim/mod.ts";

powar.runCli(() => ({
  rootPath: powar.dir(import.meta),
  modules: [
    nvim({}),
  ],
}));
```

Then, running `deno run main.ts` should produce:
```
All module dependencies met.
Running nvim ..
  Neovim configuration installed.
Done.
```

## API and command-line arguments

To see all the available command-line arguments for `powar_init`, run
`powar_init -h`.

<!-- TODO: Docs link -->
<!-- All available API functions provided by `powar-ts` are documented in
[here](https://kontheocharis.github.io/powar-ts). -->
