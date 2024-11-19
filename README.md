# create-ccc-app

`create-ccc-app`(Create CCC App) is a CLI tool that helps you quickly bootstrap `CKB` applications powered by [@ckb-ccc](https://github.com/ckb-devrel/ccc) SDK. It allows you to generate a project using **`Next.js`** or **`Create React App`**, with support for both **`TypeScript`** and **`JavaScript`**.

## Getting Started

Basic usage:

```bash filename="Terminal"
npx create-ccc-app@latest [project-name] [options]
```

### Interactive

You can create a new project interactively by running:

```bash
npx create-ccc-app@latest
# or
yarn create ccc-app
# or
pnpm create ccc-app
# or
bunx create-ccc-app
```

You will then be asked the following prompts:

```bash
✔ What is your project named? … my-ckb-app
✔ Would you like to use TypeScript? … No / Yes
? Select a framework to use: › - Use arrow-keys. Return to submit.
❯   Create Next App (Next.js) v14
    Create React App
```

Once you've answered the prompts, a new project will be created with your chosen configuration.

### Non-interactive

You can also pass command line arguments to set up a new project
non-interactively. See `create-ccc-app --help`:

```bash filename="Terminal"
npx create-ccc-app@latest [project-name] [options]
```

The following options are available:

| Options                                 | Description                                                     |
| --------------------------------------- | --------------------------------------------------------------- |
| `-h` or `--help`                        | Show all available options                                      |
| `-v` or `--version`                     | Output the version number                                       |
| `--ts` or `--typescript`                | Initialize as a TypeScript project (default)                    |
| `--js` or `--javascript`                | Initialize as a JavaScript project                              |
| `--cra` or `--react`                    | Initialize as a Create React App(CRA) project.                  |
| `--cna14` or `--next14`                 | Initialize as a Create Next App(CNA) v14 project. (default)     |
| `--use-npm`                             | Explicitly tell the CLI to bootstrap the application using npm  |
| `--use-pnpm`                            | Explicitly tell the CLI to bootstrap the application using pnpm |
| `--use-yarn`                            | Explicitly tell the CLI to bootstrap the application using Yarn |
| `--use-bun`                             | Explicitly tell the CLI to bootstrap the application using Bun  |
| `--skip-install`                        | Explicitly tell the CLI to skip installing packages             |

Examples:

```bash filename="Terminal"
npx create-ccc-app@latest my-ckb-app --ts --next14
```
This command creates a new **`Next.js 14`** project named **`my-ckb-app`** using **`TypeScript`** and installs the relevant dependencies for the project using **`npm`** as the package manager.

```bash filename="Terminal"
pnpm create ccc-app my-ckb-app --js --cra
```
This command creates a new **`Create React App`** project named **`my-ckb-app`** using **`JavaScript`** and installs the relevant dependencies for the project using **`pnpm`** as the package manager.

```bash filename="Terminal"
yarn create ccc-app my-ckb-app --js --next14 --skip-install
```
This command creates a new **`Next.js 14`** project named **`my-ckb-app`** using **`JavaScript`**, specifies **`yarn`** as the default package manager, and skips installing the dependencies.


