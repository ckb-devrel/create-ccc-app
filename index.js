#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const packageJson = require('./package.json');
const updateCheck = require('update-check');
const prompts = require('prompts');
const { blue, bold, cyan, green, red, yellow } = require('picocolors');
const { validateNpmName, isFolderEmpty, getPkgManager, install } = require('./helpers');
const { cccConnectorReactVersion } = require('./config');

let projectName = ''

const handleSigTerm = () => process.exit(0)

process.on('SIGINT', handleSigTerm)
process.on('SIGTERM', handleSigTerm)

const onPromptState = (state) => {
    if (state.aborted) {
        // If we don't re-enable the terminal cursor before exiting
        // the program, the cursor will remain hidden
        process.stdout.write('\x1B[?25h')
        process.stdout.write('\n')
        process.exit(1)
    }
}


const program = new Command(packageJson.name)
    .version(
        packageJson.version,
        '-v, --version',
        `Output the current version of ${packageJson.name}.`
    )
    .argument('[directory]')
    .usage('[directory] [options]')
    .helpOption(
        '-h, --help',
        'Display this help message.')
    .option(
        '--ts, --typescript',
        'Use TypeScript. (default)'
    )
    .option(
        '--js, --javascript',
        'Use JavaScript.'
    )
    .option(
        '--cra, --react',
        'Initialize as a Create React App(CRA) project. '
    )
    .option(
        '--cna14, --next14',
        'Initialize as a Create Next App(CNA) v14 project. (default)'
    )
    .option(
        '--use-npm',
        'Explicitly tell the CLI to bootstrap the application using npm.'
    )
    .option(
        '--use-pnpm',
        'Explicitly tell the CLI to bootstrap the application using pnpm.'
    )
    .option(
        '--use-yarn',
        'Explicitly tell the CLI to bootstrap the application using Yarn.'
    )
    .option(
        '--use-bun',
        'Explicitly tell the CLI to bootstrap the application using Bun.'
    )
    .option(
        '--skip-install',
        'Explicitly tell the CLI to skip installing packages.'
    )
    .action((name) => {
        // Commander does not implicitly support negated options. When they are used
        // by the user they will be interpreted as the positional argument (name) in
        // the action handler. See https://github.com/tj/commander.js/pull/1355
        if (name && !name.startsWith('--no-')) {
            projectName = name
        }
    })
    .allowUnknownOption()
    .parse(process.argv)

const opts = program.opts()
const { args } = program
//console.log(opts, args, projectName)

const packageManager = !!opts.useNpm
    ? 'npm'
    : !!opts.usePnpm
        ? 'pnpm'
        : !!opts.useYarn
            ? 'yarn'
            : !!opts.useBun
                ? 'bun'
                : getPkgManager()

//console.log(packageManager)

async function run() {
    console.log()
    // Check ProjectPath
    if (projectName && typeof projectName === 'string') {
        projectName = projectName.trim()
    }

    if (!projectName) {
        const res = await prompts({
            onState: onPromptState,
            type: 'text',
            name: 'path',
            message: 'What is your project named?',
            initial: 'my-ckb-app',
            validate: (name) => {
                const validation = validateNpmName(path.basename(path.resolve(name)))
                if (validation.valid) {
                    return true
                }
                return 'Invalid project name: ' + validation.problems[0]
            },
        })

        if (typeof res.path === 'string') {
            projectName = res.path.trim()
        }
    }

    if (!projectName) {
        console.log(
            '\nPlease specify the project directory:\n' +
            `  ${cyan(opts.name())} ${green('<project-directory>')}\n` +
            'For example:\n' +
            `  ${cyan(opts.name())} ${green('my-next-app')}\n\n` +
            `Run ${cyan(`${opts.name()} --help`)} to see all options.`
        )
        process.exit(1)
    }

    const appPath = path.resolve(projectName)
    const appName = path.basename(appPath)

    const validation = validateNpmName(appName)
    if (!validation.valid) {
        console.error(
            `Could not create a project called ${red(
                `"${appName}"`
            )} because of npm naming restrictions:`
        )

        validation.problems.forEach((p) =>
            console.error(`    ${red(bold('*'))} ${p}`)
        )
        process.exit(1)
    }

    if (fs.pathExistsSync(appPath) && !isFolderEmpty(appPath)) {
        console.error(
            `Could not create a project called ${red(
                `"${appName}"`
            )} because a project with the same name already exists.`
        )
        process.exit(1)
    }

    // js, ts
    if (!opts.typescript && !opts.javascript) {
        const styledTypeScript = blue('TypeScript')
        const { typescript } = await prompts(
            {
                type: 'toggle',
                name: 'typescript',
                message: `Would you like to use ${styledTypeScript}?`,
                initial: true,
                active: 'Yes',
                inactive: 'No',
            },
            {
                /**
                 * User inputs Ctrl+C or Ctrl+D to exit the prompt. We should close the
                 * process and not write to the file system.
                 */
                onCancel: () => {
                    console.error('Exiting.')
                    process.exit(1)
                },
            }
        )
        /**
         * Depending on the prompt response, set the appropriate program flags.
         */
        opts.typescript = Boolean(typescript)
        opts.javascript = !Boolean(typescript)
    }

    // Handle framework flags
    if (!opts.framework) {
        if (opts.react) {
            opts.framework = 'react';
        } else if (opts.next14) {
            opts.framework = 'next14';
        }

        // If no valid framework flag is provided, prompt the user
        if (!opts.framework) {
            const frameworks = [
                { title: 'Create Next App (Next.js) v14', value: 'next14' },
                { title: 'Create React App', value: 'react' },
            ];

            const { framework } = await prompts(
                {
                    type: 'select',
                    name: 'framework',
                    message: 'Select a framework to use:',
                    choices: frameworks,
                    initial: 0,
                },
                {
                    onCancel: () => {
                        console.error('Exiting.');
                        process.exit(1);
                    },
                }
            );

            opts.framework = framework;

            if (!opts.framework) {
                console.error(red('You must select a framework to proceed.'));
                process.exit(1);
            }
        }
    }

    console.log()

    console.log(bold(`Using ${packageManager}.`));
    // Copy template
    const language = opts.javascript ? "js" : "ts";

    console.log(`📦 Initializing project with template: ${cyan(`${opts.framework}-${language}`)}`);

    const templatePath = path.join(__dirname, `app-templates/${opts.framework}-${language}`);
    if (!fs.pathExistsSync(templatePath)) {
        console.error(
            `Could not find a template named ${red(
                `"${opts.framework}-${language}-template"`
            )}.`
        )
        console.error(`\n 😮‍💨 Project ${projectName} created failed!\n`);
        process.exit(1)
    }

    // 创建项目文件夹并复制模板
    const originalDirectory = process.cwd();
    const projectPath = path.join(originalDirectory, projectName);

    fs.ensureDirSync(projectPath);
    fs.copySync(templatePath, projectPath);

    // 修改 package.json 的 name 字段
    const packageJsonPath = path.join(projectPath, 'package.json');
    let appPackageJson = '';
    if (fs.pathExistsSync(packageJsonPath)) {
        try {
            appPackageJson = fs.readJsonSync(packageJsonPath); // 读取 package.json
            appPackageJson.name = projectName; // 修改 name 字段

            // set ccc version
            appPackageJson.dependencies = {
                ...appPackageJson.dependencies,
                "@ckb-ccc/connector-react": cccConnectorReactVersion,
            };

            fs.writeJsonSync(packageJsonPath, appPackageJson, { spaces: 2 }); // 写入修改后的内容
            console.log(green(`Updated ${projectName}/package.json.`));
        } catch (error) {
            console.error(red(`Failed to update package.json: ${error.message}`));
            process.exit(1);
        }
    } else {
        console.error(
            red(`Could not find package.json in the template. Make sure your template includes a package.json.`)
        );
        process.exit(1);
    }

    console.log(`\n🎉 Project ${projectName} created!\n`);

    const useYarn = packageManager === 'yarn';

    if (opts.skipInstall) {
    /*    console.log('Skip install the dependencies, you can run the install command inside the project directory:')
        console.log()
        console.log(cyan(`    npm install`))
        console.log('or', cyan(`  pnpm install`))
        console.log('or', cyan(`  yarn install`))
        console.log('or', cyan(`  bun install`))
        console.log('    Install the dependencies.')*/

        console.log('Skip install the dependencies, we suggest that you begin by typing:')
        console.log()
        console.log(cyan('  cd'), projectName)
        console.log(`  ${cyan(`${packageManager} install`)}`)
        console.log()   

    } else {
        console.log("\nInstalling dependencies:");
        for (const dependency in appPackageJson.dependencies) {
            const version = appPackageJson.dependencies[dependency];
            console.log(`- ${cyan(dependency)}: ${yellow(version)}`);
        }

        console.log("\nInstalling devDependencies:");
        for (const dependency in appPackageJson.devDependencies) {
            const version = appPackageJson.devDependencies[dependency];
            console.log(`- ${cyan(dependency)}: ${yellow(version)}`);
        }

        console.log()
        console.log('Installing packages. This might take a couple of minutes.')
        console.log()

        // Change to the project directory
        process.chdir(appPath);
        await install(packageManager)
        console.log('Packages installed.')
        console.log()
    }

    if (opts.framework === 'next14' || opts.framework === 'next15') {
        console.log('Inside the project directory, you can run several commands:')
        console.log()
        console.log(cyan(`  ${packageManager} ${useYarn ? '' : 'run '}dev`))
        console.log('  Starts the development server.')
        console.log()
        console.log(cyan(`  ${packageManager} ${useYarn ? '' : 'run '}build`))
        console.log('  Builds the app for production.')
        console.log()
        console.log(cyan(`  ${packageManager} start`))
        console.log('  Runs the built app in production mode.')
        console.log()
        console.log('We suggest that you begin by typing:')
        console.log()
        console.log(cyan('  cd'), projectName)
        console.log(`  ${cyan(`${packageManager} ${useYarn ? '' : 'run '}dev`)}`)
        console.log()
    } else if (opts.framework === 'react') {
        console.log('Inside the project directory, you can run several commands:')
        console.log()
        console.log(cyan(`  ${packageManager} start`))
        console.log('  Starts the development server.')
        console.log()
        console.log(cyan(`  ${packageManager} ${useYarn ? '' : 'run '}build`))
        console.log('  Builds the app for production.')
        console.log()
        console.log('We suggest that you begin by typing:')
        console.log()
        console.log(cyan('  cd'), projectName)
        console.log(`  ${cyan(`${packageManager} start`)}`)
        console.log()   
    }

    console.log(`${green('Success!')} Created ${projectName} at ${projectPath}`)
    console.log()
}

const update = updateCheck(packageJson).catch(() => null)

async function notifyUpdate() {
    try {
        if ((await update)?.latest) {
            const global = {
                npm: 'npm i -g',
                yarn: 'yarn global add',
                pnpm: 'pnpm add -g',
                bun: 'bun add -g',
            }
            const updateMessage = `${global[packageManager]} ${packageJson.name}`
            console.log(
                yellow(bold('A new version of `${packageJson.name}` is available!')) +
                '\n' +
                'You can update by running: ' +
                cyan(updateMessage) +
                '\n'
            )
        }
        process.exit(0)
    } catch {
        // ignore error
    }
}

async function exit(reason) {
    console.log()
    console.log('Aborting installation.')
    if (reason.command) {
        console.log(`  ${cyan(reason.command)} has failed.`)
    } else {
        console.log(
            red('Unexpected error. Please report it as a bug:') + '\n',
            reason
        )
    }
    console.log()
    await notifyUpdate()
    process.exit(1)
}

run().then(notifyUpdate).catch(exit)
