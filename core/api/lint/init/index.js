/**
 * @file
 * @desc lint project
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');
const co = require('co');
const { red, green } = require('chalk');
const chokidar = require('chokidar');

const fse = require('fs-extra');

const hook = require('../../hook');

const cwd = process.cwd();

const eslint = require('../lib/eslint/index');
const stylelint = require('../lib/stylelint/index');

let globalParams;

function initParams(params) {
    globalParams = {
        ...params,
        finalLintTarget: cwd,
        stylelintResultSrcFile: path.resolve(cwd, 'lint-result', 'stylelint-result-src.html'),
        eslintResultSrcFile: path.resolve(cwd, 'lint-result', 'eslint-result-src.html'),
        lintResultIndexFile: path.resolve(cwd, 'lint-result', 'lint-result-index.html'),
    };
}

/**
 * @func
 * @desc lint
 */
module.exports = (params) => {
    co(function* init() {
        // { lintTarget, watch, fix } = params
        initParams(params);

        const { stylelintResultSrcFile, eslintResultSrcFile, lintResultIndexFile } = globalParams;

        // 初始化参数
        eslint.initParams({ ...globalParams });
        stylelint.initParams({ ...globalParams });

        // 初始化配置文件
        console.log(green('\ncreating config files\n'));
        yield eslint.initConfigFiles(params);
        yield stylelint.initConfigFiles(params);

        // 安装相应依赖
        console.log(green('\ncheck dependecies\n'));
        eslint.installDependencies(params);
        stylelint.installDependencies();

        // 添加 Hook
        console.log(green('\nadd Hook (git commit)\n'));
        hook.addHook({});

        console.log(green('\ndone!\n'));
    });
};
