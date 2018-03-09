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


const util = require('../util');

const fse = require('fs-extra');

const cwd = process.cwd();

function* initConfigFiles({ type }) {
    function cpTpt(templatePath) {
        return util.copyTpt(path.join(__dirname, templatePath), cwd);
    }
    yield cpTpt('template');
}

function installDependencies() {
    util.ensureModule([
        'stylelint',
        'stylelint-config-standard',
        'stylelint-formatter-html',
    ], cwd);
}

function execLint({ lintResultSrcFile, fix }) {
    // 检查依赖是否安装
    if (!fs.existsSync(path.join(cwd, '/node_modules/stylelint/bin/stylelint.js'))) {
        console.log(red(`\nError: stylelint is required but not installed, please run ${green('bio lint init')} first\n`));
        return 999; // exitCode
    }

    const lintedFiles = `"${path.join(cwd, '**/*.css')}" "${path.join(cwd, '**/*.less')}" "${path.join(cwd, '**/*.scss')}" "${path.join(cwd, '**/*.sass')}" "${path.join(cwd, '**/*.vue')}"`;
    const order = `${cwd}/node_modules/stylelint/bin/stylelint.js ${lintedFiles} ${fix ? '--fix' : ''} --cache --cache-location ${path.join(path.dirname(lintResultSrcFile), '.stylelintcache')} -f string --custom-formatter ${cwd}/node_modules/stylelint-formatter-html --syntax less > ${lintResultSrcFile}`;

    // 准备结果文件
    fse.ensureFileSync(lintResultSrcFile);
    const child = sh.exec(order);

    // https://github.com/stylelint/stylelint/blob/master/docs/user-guide/cli.md
    switch (child.code) {
    case 1:
        console.log(red('\nstyleint: Something unknown went wrong.\n'));
        break;
    case 2:
        break;
    case 78:
        console.log(red('\nstyleint: There was some problem with the configuration file.\n'));
        break;
    case 80:
        console.log(red('\nstyleint: A file glob was passed, but it found no files..\n'));
        break;
    default:
        break;
    }

    return child.code;
}

let globalParams;

/**
 * @func
 * @desc lint
 */
module.exports = {
    initParams(params) {
        globalParams = { ...params, lintResultSrcFile: path.resolve(cwd, 'lint-result', 'stylelint-result-src.html') };
    },

    initConfigFiles,

    installDependencies,

    exec() {
        const { lintResultSrcFile, fix } = globalParams;
        return execLint({ lintResultSrcFile, fix });
    },
};
