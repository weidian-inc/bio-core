/**
 * @file
 * @desc lint project
 * @author liuyuanyangscript@gmail.com https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const { red, green } = require('chalk');

const pathUtil = require('../../../../tool/path');
const fileUtil = require('../../../../tool/file');

const util = require('../util');

const fse = require('fs-extra');

const cwd = process.cwd();

function* initConfigFiles({ type }) {
    function cpTpt(templatePath) {
        return util.copyTpt(path.join(__dirname, templatePath), cwd);
    }
    switch (type) {
    case 'es6':
        yield cpTpt('template-es6');
        break;
    case 'es5':
        yield cpTpt('template-es5');
        break;
    default:
        console.log(red('unkown type'));
    }
}

function installDependencies({ type }) {
    const commonModule = ['babel-eslint',
        'eslint', 'eslint-plugin-react', 'eslint-plugin-vue', 'eslint-config-vue'];

    const es5Module = [...commonModule, 'eslint-config-airbnb-es5'];
    const es6Module = [...commonModule, 'eslint-config-airbnb',
        'eslint-plugin-import',
        'eslint-plugin-jsx-a11y',
        'eslint-plugin-lean-imports',
    ];

    let modules;
    switch (type) {
    case 'es5':
        modules = es5Module;
        break;
    default:
        modules = es6Module;
    }
    util.ensureModule(
        modules
        , cwd,
    );
}

function execLint({ finalLintTarget, lintResultSrcFile, fix }) {
    if (!fs.existsSync(path.join(cwd, 'node_modules/eslint/lib/cli.js'))) {
        console.log(red(`\nError: eslint is required but not installed, please run ${green('bio lint init')} first\n`));
        return 999; // exitCode
    }

    const eslintCliPath = path.join(cwd, 'node_modules/eslint/lib/cli.js');
    const eslintCli = require(eslintCliPath);
    const eslintOrder = ['', '', finalLintTarget, '--format', 'html', '--ext', 'vue,js', '--output-file', lintResultSrcFile];

    // 准备结果文件
    fse.ensureFileSync(lintResultSrcFile);

    const exitCode = eslintCli.execute(fix ? eslintOrder.concat(['--fix']) : eslintOrder);
    return exitCode;
}


let globalParams;

/**
 * @func
 * @desc lint
 */
module.exports = {
    initParams(params) {
        globalParams = { ...params, lintResultSrcFile: path.resolve(cwd, 'lint-result', 'eslint-result-src.html') };
    },

    initConfigFiles,

    installDependencies,

    exec() {
        const { finalLintTarget, lintResultSrcFile, fix } = globalParams;
        return execLint({ finalLintTarget, lintResultSrcFile, fix });
    },
};
