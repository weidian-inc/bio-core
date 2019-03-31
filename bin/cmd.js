module.exports = (commander) => {
    require('colors');

    require('./mods/check-node-version')();
    require('./mods/watch-error')();

    const fs = require('fs');
    const path = require('path');
    const fse = require('fs-extra');
    const core = require('../core/index');

    const scaffoldUtil = core.scaffold.util;

    const showHelp = () => {
        console.log(['',
            ` - init project                >  ${'bio init [scaffoldName]'.green}`,
            ` - run scaffold task           >  ${'bio run <task>'.green}`,
            ` - run local mock              >  ${'bio mock [port]'.green}`,
            ` - show scaffold               >  ${'bio scaffold show <scaffoldName>'.green}`,
            ` - create scaffold             >  ${'bio scaffold create'.green}`,
            ` - init lint                   >  ${'bio lint init [-t, --type [value]]'.green}`,
            ` - run lint                    >  ${'bio lint [-w, --watch]'.green}`,
            ` - help                        >  ${'bio help'.green}\n`,
        ].join('\n'));

        console.log(`doc: ${'https://github.com/weidian-inc/bio-cli'.green}\n`);
    };

    core.set({
        scaffoldList: [{
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

        beforeScaffoldInstall(installationDir) {
            const npmrcPath = path.join(installationDir, '.npmrc');

            fse.ensureFileSync(npmrcPath);
            fs.writeFileSync(npmrcPath, [
                // 'sass_binary_site=https://npm.taobao.org/mirrors/node-sass/',
                // 'phantomjs_cdnurl=https://npm.taobao.org/mirrors/phantomjs/',
                // 'electron_mirror=https://npm.taobao.org/mirrors/electron/',
            ].join('\n'));
        }
    });

    /***************** init project start *************************/
    commander
        .command('init [scaffoldName]')
        .description('init project.')
        .parse(process.argv)
        .action((scaffoldName) => {
            core.init({ scaffoldName });
        });
    /***************** init project end *************************/

    /***************** run project start *************************/
    commander
        .command('run <task>')
        .description('run.')
        .action((task) => {
            core.scaffold.run(task);
        });
    /***************** run project end *************************/


    /***************** scaffold start *************************/ 
    commander
        .command('scaffold-show <scaffoldName>')
        .description('orders about scaffold.')
        .action((scaffoldName) => {
            core.scaffold.show(scaffoldName);
        });
    /***************** scaffold end *************************/

    /***************** mock start *************************/
    commander
        .command('mock [port]')
        .description('local mock.')
        .action((port) => {
            core.mock(port);
        });
    /***************** mock end *************************/

    /***************** lint start *************************/
    commander
        .command('lint-run')
        .description('lint run.')
        .option('-w, --watch', 'watch')
        .option('-f, --fix', 'format')
        .action((options) => {
            core.lint.run({
                watch: options.watch,
                fix: options.fix
            });
        });
    commander
        .command('lint-init')
        .description('lint init.')
        .action(() => {
            core.lint.init();
        });
    /***************** lint end *************************/

    /***************** docsite start *************************/
    commander
        .command('docsite-init')
        .description('docsite')
        .action(() => {
            core.docsite.init();
        });
    commander
        .command('docsite-serve [target]')
        .option('-m, --multi', 'multi website')
        .option('-i, --show-index', 'showIndex')
        .option('-p, --port', 'port')
        .description('docsite serve')
        .action((target, options) => {
            core.docsite.serve({ multi: options.multi, target, showIndex: options.showIndex, port: options.port });
        });
    commander
        .command('docsite-push [branch]')
        .option('-m, --multi', 'multi website')
        .description('docsite')
        .action((branch, options) => {
            core.docsite.push({ multi: options.multi, branch });
        });
    commander
        .command('docsite-clear')
        .description('docsite clear project.')
        .action(() => {
            core.docsite.clear();
        });
    /***************** docsite end *************************/

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

    /***************** plugins start *************************/
    commander
        .command('plugin-init')
        .description('plugin')
        .action(() => {
            core.plugin.init();
        });
    commander
        .command('plugin-add <pluginName>')
        .description('plugin')
        .action((pluginName) => {
            core.plugin.add({ pluginName, commanderEvents: commander._events });
        });
    commander
        .command('plugin-remove <pluginName>')
        .description('plugin')
        .action((pluginName) => {
            core.plugin.remove({ pluginName });
        });
    commander
        .command('plugin-list')
        .description('plugin')
        .action(() => {
            core.plugin.list();
        });
    commander
        .command('plugin-link')
        .description('plugin')
        .action(() => {
            core.plugin.link();
        });
    commander
        .command('plugin-unlink')
        .description('plugin')
        .action(() => {
            core.plugin.unlink();
        });
    /***************** plugins end *************************/

    // error on unknown commands
    commander.on('command:*', function () {
        console.error(`Invalid command: ${'%s'.yellow}\nSee list of available commands.`, commander.args.join(' '));
        showHelp();
        process.exit(1);
    });

    commander.parse(process.argv);

    if (process.argv.slice(2).length === 0) {
        if (!scaffoldUtil.getScaffoldNameFromConfigFile()) {
            core.init().then(() => {
                core.scaffold.run('dev-daily', { watch: true });
            });
        } else {
            core.scaffold.run('dev-daily', { watch: true });
        }
    }
};
