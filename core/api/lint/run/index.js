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
const chokidar = require('chokidar');
const anymatch = require('anymatch');
const fse = require('fs-extra');

const cwd = process.cwd();

const ncp = require('copy-paste');

const eslint = require('../lib/eslint/index');
const stylelint = require('../lib/stylelint/index');

function watchFiles(fileChangeCallback) {
    // 处理监听
    const chokidarWatcher = chokidar.watch('.', {
        persistent: true,
        alwaysStat: true,
        interval: 300,
        ignored: /(lint\-result)|(\.git)|(\.ds_store)|(node_modules)|(stats\.json)|(build)/i,
    });


    // init matchers
    let matchers = [];
    const matcherFiles = ['.eslintignore', '.stylelintignore'];
    matcherFiles.forEach((fileName) => {
        const filePath = path.resolve(process.cwd(), fileName);
        if (fs.existsSync(filePath)) {
            const content = fse.readFileSync(filePath);
            matchers = matchers.concat(content.toString().split('\n'));
        }
    });
    matchers = Array.from(new Set(matchers));

    // debounce
    let timer;
    const debunceCallback = (file) => {
        if (anymatch(matchers, file)) {
            console.log('ignored: ', file);
            return;
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
            clearTimeout(timer);
            fileChangeCallback(file);
        }, 500);
    };

    // listeners
    chokidarWatcher.on('ready', () => {
        chokidarWatcher.on('add', (file) => {
            console.log('add: ', file);
            debunceCallback(file);
        });
        chokidarWatcher.on('change', (file) => {
            console.log('change: ', file);
            debunceCallback(file);
        });
        chokidarWatcher.on('unlink', (file) => {
            console.log('unlink: ', file);
            debunceCallback(file);
        });
        chokidarWatcher.on('unlinkDir', (file) => {
            console.log('unlinkDir: ', file);
            debunceCallback(file);
        });
    });

    return chokidarWatcher;
}

let globalParams;

function initParams(params) {
    const { lintTarget } = params;
    globalParams = {
        ...params,
        finalLintTarget: lintTarget ? path.resolve(cwd, lintTarget) : cwd,
        stylelintResultSrcFile: path.resolve(cwd, 'lint-result', 'stylelint-result-src.html'),
        eslintResultSrcFile: path.resolve(cwd, 'lint-result', 'eslint-result-src.html'),
        statusResultSrcFile: path.resolve(cwd, 'lint-result', 'status-result-src.html'),
        lintResultIndexFile: path.resolve(cwd, 'lint-result', 'lint-result-index.html'),
    };
}


function writeStatusFile({ eslintExitCode, stylelintExitCode, statusResultSrcFile }) {
    const eslintTxt = eslintExitCode ? '<span style="color:#B84C4B">eslint unpassed!</span>' : '<span style="color:#478749">eslint passed!</span>';
    const stylelintTxt = stylelintExitCode ? '<span style="color:#B84C4B">stylelint unpassed</span>' : '<span style="color:#478749">stylelint passed！</span>';
    const txt = `${eslintTxt} ${eslintExitCode || stylelintExitCode ? '╮(╯_╰)╭' : 'd=(￣▽￣*)b'} ${stylelintTxt}`;
    fse.writeFileSync(statusResultSrcFile, `<p style="text-align:center;font-size: 30px;">${txt}</p>`);
}
/**
 * @func
 * @desc lint
 */
module.exports = (params) => {
    // { lintTarget, watch, fix } = params
    initParams(params);

    const { finalLintTarget, stylelintResultSrcFile, statusResultSrcFile, eslintResultSrcFile, lintResultIndexFile, watch } = globalParams;

    let port = null;

    // 创建结果页面
    fse.ensureFileSync(lintResultIndexFile);
    fse.writeFileSync(lintResultIndexFile, require('./result.html')({ stylelintResultSrcFile, eslintResultSrcFile, statusResultSrcFile, port }));

    if (watch) {
        // 启动 socket server
        port = 3000;
        const io = require('socket.io')(port);

        // 初始化结果页面（带监听器）
        fse.writeFileSync(lintResultIndexFile, require('./result.html')({ stylelintResultSrcFile, eslintResultSrcFile, statusResultSrcFile, port }));

        const chokidarWatcher = watchFiles((changedFile) => {
            console.log('Lint Running...');

            // 更新页面状态
            io.emit('update', {
                stylelint: {
                    status: '(running)',
                    result: '',
                },
                eslint: {
                    status: '(running)',
                    result: '',
                },
            });

            const stylelintExitCode = stylelint.exec();
            const eslintExitCode = eslint.exec();
            writeStatusFile({ eslintExitCode, stylelintExitCode, statusResultSrcFile });

            // 更新页面状态
            io.emit('update', {
                stylelint: {
                    status: '',
                    // result: stylelintExitCode ? '未通过' : '通过',
                    result: '',
                },
                eslint: {
                    status: '',
                    // result: eslintExitCode ? '未通过' : '通过',
                    result: '',
                },
            });
            console.log('Lint Done...');
        });

        const kill = () => {
            chokidarWatcher.close();
            io.close();
            process.exit(1);
        };

        process.on('SIGINT', kill);
        process.on('uncaughtException', kill);
        process.on('unhandledRejection', (reason, p) => {
            console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
            kill();
        });
    }

    // 初始化参数
    eslint.initParams({ ...globalParams });
    stylelint.initParams({ ...globalParams });

    // run
    console.log(green('\nrunning lint\n'));
    const eslintExitCode = eslint.exec();
    const stylelintExitCode = stylelint.exec();

    console.log(eslintExitCode ? red('eslint unpassed') : green('eslint passed！'), '; ', stylelintExitCode ? red('stylelint unpassed') : green('stylelint passed！'));
    writeStatusFile({ eslintExitCode, stylelintExitCode, statusResultSrcFile });
    ncp.copy(lintResultIndexFile, () => {
        console.log(green(`\nresult page has be created and url was copied, you can paste directly to browser address area to see result: ${lintResultIndexFile}\n`));
    });
};
