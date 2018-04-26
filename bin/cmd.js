module.exports = (commander) => {
    require('colors');

    const nodeVersion = process.version.replace('v', '');
    if (nodeVersion.split('.')[0] < 8) {
        console.log(`\nNode version 8.9.1+ is required for bio (current version is ${nodeVersion}), please upgrade your node.\n`.red);
        return;
    }

    const fs = require('fs');
    const path = require('path');
    const fse = require('fs-extra');
    const inquirer = require('inquirer');
    const core = require('../core/index');

    const scaffoldUtil = core.scaffold.util;

    process.on('uncaughtException', (e) => {
        console.log(e);
        process.exit(1);
    });

    process.on('SIGINT', () => {
        process.exit(0);
    });

    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    });

    const showHelp = () => {
        console.log(['',
            '',
            ` - init project                >  ${'bio init [scaffoldName]'.green}`,
            '',
            ` - run scaffold task           >  ${'bio run <task> [-n, --no-watch]'.green}`,
            ` - run local mock              >  ${'bio mock [port]'.green}`,
            '',
            ` - show scaffold               >  ${'bio scaffold show <scaffoldName>'.green}`,
            ` - create scaffold             >  ${'bio scaffold create'.green}`,
            '',
            ` - init lint                   >  ${'bio lint init [-t, --type [value]]'.green}`,
            ` - run lint                    >  ${'bio lint [-w, --watch]'.green}`,
            '',
            ` - help                        >  ${'bio help'.green}\n`,
            '',
        ].join('\n'));
    };

    core.set({
        configName: '.biorc',

        scaffold: {
            registry: 'https://registry.npmjs.org/',

            list: [{
                shortName: 'pure',
                fullName: 'bio-scaffold-pure',
                desc: 'traditional project',
                version: 'latest',
            }, {
                shortName: 'vue',
                fullName: 'bio-scaffold-vue',
                desc: 'vue project',
                version: 'latest',
            }, {
                shortName: 'react',
                fullName: 'bio-scaffold-react',
                desc: 'react project',
                version: 'latest',
            }],

            preInstall(installationDir) {
                const npmrcPath = path.join(installationDir, '.npmrc');

                fse.ensureFileSync(npmrcPath);
                fs.writeFileSync(npmrcPath, [
                    // 'sass_binary_site=https://npm.taobao.org/mirrors/node-sass/',
                    // 'phantomjs_cdnurl=https://npm.taobao.org/mirrors/phantomjs/',
                    // 'electron_mirror=https://npm.taobao.org/mirrors/electron/',
                ].join('\n'));
            },
        },

    });

    commander
        .command('init [scaffoldName]')
        .description('init project.')
        .parse(process.argv)
        .action((scaffoldName) => {
            core.init({ scaffoldName });
        });

    commander
        .command('run <task>')
        .description('run.')
        .option('-n, --no-watch', 'watch file changes')
        .action((task, options) => {
            const { watch } = options;

            if (!scaffoldUtil.getScaffoldNameFromConfigFile()) {
                core.init().then(() => {
                    core.scaffold.run(task, { watch });
                });
            } else {
                core.scaffold.run(task, { watch });
            }
        });

    // scaffold orders
    commander
        .command('scaffold <cmd> [scaffoldName]')
        .description('orders about scaffold.')
        .action((cmd, param) => {
            if (cmd === 'create') {
                const scaffoldName = 'bio-scaffold-demo';

                inquirer.prompt([{
                    type: 'input',
                    name: 'createdScaffoldName',
                    message: 'Input scaffold name',
                }]).then((answers) => {
                    console.log(`\nCreating scaffold: ${scaffoldName}. You can modify scaffold information after the installation`);
                    core.scaffold.install(scaffoldName);
                    core.scaffold.rename(scaffoldName, answers.createdScaffoldName);
                    core.scaffold.show(answers.createdScaffoldName);
                });
            } else if (cmd === 'show') {
                if (!param) {
                    console.log('\nPlease input scaffold name you want to show: bio scaffold show <scaffoldName>\n');
                    return;
                }

                core.scaffold.show(param);
            }
        });

    commander
        .command('mock [port]')
        .description('local mock.')
        .action((port) => {
            core.mock(port);
        });

    commander
        .command('lint [lintTarget]')
        .description('lint.')
        .option('-w, --watch', 'watch')
        .option('-f, --fix', 'format')
        .action((lintTarget, cmd) => {
            if (lintTarget && lintTarget === 'init') {
                core.lint.init();
            } else {
                core.lint.run({ lintTarget, watch: cmd.watch, fix: cmd.fix });
            }
        });

    commander
        .command('test')
        .description('add test configs.')
        .action(() => {
            core.test();
        });

    commander
        .command('help')
        .description('help.')
        .action(showHelp);

    commander
        .command('update')
        .action(() => {
            require('child_process').execSync('npm install bio-cli@latest -g', {
                stdio: 'inherit',
            });
        });

    commander.parse(process.argv);

    if (commander.args.length === 0) {
        showHelp();
    }
};
