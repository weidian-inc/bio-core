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

function chooseInitType() {
    return (done) => {
        inquirer.prompt([{
            type: 'list',
            name: 'initType',
            message: 'select your lint type',
            choices: [
                'js:es6',
                'js:es5',
                'stylelint',
            ],
        }]).then((answers) => {
            done(null, answers.initType);
        });
    };
}

function* initStylelint() {
    // 初始化参数
    eslint.initParams();

    // 安装相应依赖
    console.log(green('\ninstalling stylelint dependencies...'));
    stylelint.installDependencies();

    // 初始化配置文件
    console.log(green('\ncreating stylelint config files\n'));
    yield stylelint.initConfigFiles();

    console.log(green('\nstyleint configuration finished!\n'));
}

function* initEslint({ initType }) {
    // 初始化参数
    eslint.initParams();

    // 安装相应依赖
    console.log(green('\ninstalling eslint dependencies'));
    eslint.installDependencies({ type: initType });

    // 初始化配置文件
    // console.log(green('\ncreating eslint config files\n'));
    yield eslint.initConfigFiles({ type: initType });

    console.log(green('\neslint configuration finished!\n'));
}

/**
 * @func
 * @desc lint
 */
module.exports = (params) => {
    co(function* init() {
        const initType = yield chooseInitType();

        // globalParams = { ...globalParams, type: initType };

        switch(initType) {
            case 'stylelint':
                yield initStylelint();
                break;
            case 'js:es6':
            case 'js:es5':
                yield initEslint({ initType });
                break;
        }

        console.log(`\nGet started: ${'bio lint'.green}\n`);
    });
};
