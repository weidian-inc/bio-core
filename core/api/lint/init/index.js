/**
 * @file
 * @desc lint project
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');
const co = require('co');
const { red, green } = require('chalk');
const chokidar = require('chokidar');
const inquirer = require('inquirer');

const fse = require('fs-extra');

const hook = require('../../hook');

const cwd = process.cwd();

const eslint = require('../lib/eslint/index');
const stylelint = require('../lib/stylelint/index');

let globalParams = {
        finalLintTarget: cwd,
        stylelintResultSrcFile: path.resolve(cwd, 'lint-result', 'stylelint-result-src.html'),
        eslintResultSrcFile: path.resolve(cwd, 'lint-result', 'eslint-result-src.html'),
        lintResultIndexFile: path.resolve(cwd, 'lint-result', 'lint-result-index.html'),
    };

function chooseInitType() {
    return (done) => {
        inquirer.prompt([{
            type: 'list',
            name: 'initType',
            message: 'select your lint type',
            choices: [
                'es6',
                'es5',
            ],
        }]).then((answers) => {
            done(null, answers.initType);
        });
    };
}

/**
 * @func
 * @desc lint
 */
module.exports = (params) => {
    co(function* init() {
        const initType = yield chooseInitType();
        globalParams = { ...globalParams, type: initType };

        const { stylelintResultSrcFile, eslintResultSrcFile, lintResultIndexFile } = globalParams;

        // 初始化参数
        eslint.initParams({ ...globalParams });
        stylelint.initParams({ ...globalParams });

        // 初始化配置文件
        console.log(green('\ncreating config files\n'));
        yield eslint.initConfigFiles({ type: initType });
        yield stylelint.initConfigFiles({ type: initType });

        // 安装相应依赖
        console.log(green('\ncheck dependecies\n'));
        eslint.installDependencies({ type: initType });
        stylelint.installDependencies();

        // 添加 Hook
        console.log(green('\nadd Hook (git commit)\n'));
        hook.addHook({});

        console.log(green('\ndone!\n'));
    });
};
