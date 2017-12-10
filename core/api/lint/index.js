/**
 * @file
 * @desc init project
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const pathUtil = require('../../tool/path');
const fileUtil = require('../../tool/file');

const fse = require('fs-extra');
const md5 = require('md5');
const syncDirectory = require('sync-directory');

const child = require('child_process');

function writePkg(pkgPath, obj) {
    fileUtil.writeFileSync(pkgPath, JSON.stringify(obj), null, '\t');
}

function ensureModule(packageNames, cwd) {
    if (!fs.existsSync(path.join(cwd, 'package.json'))) {
        writePkg(path.join(cwd, 'package.json'), {
            name: 'install-lint-modules',
        });
    }

    const uninstalled = [];
    packageNames.forEach((packageName) => {
        try {
            require(path.join(cwd, 'node_modules', packageName));
        } catch (err) {
            uninstalled.push(`${packageName}@latest`);
        }
    });

    if (uninstalled.length) {
        console.log('\ninstall modules start...\n');
        require('child_process').execSync(`cd ${cwd} && npm install ${uninstalled.join(' ')} --force`, {
            stdio: 'inherit',
        });
        console.log('\ninstall modules done.\n');
    }
}

function copyTpt(lintCacheDir) {
    const tptDir = path.join(__dirname, 'template');
    fs.readdirSync(tptDir).forEach((name) => {
        fse.copySync(path.join(tptDir, name), path.join(lintCacheDir, name));
    });
}

function getConfigFilePath(lintCacheDir, target) {
    const tptDir = path.join(__dirname, 'template');
    const targetFiles = fs.readdirSync(target);
    const tptFiles = fs.readdirSync(tptDir);

    let configFilePath;
    let ignorePath;

    // set default
    tptFiles.forEach((name) => {
        fse.copySync(path.join(tptDir, name), path.join(lintCacheDir, name));

        // set default config file if no user config
        if (/(\.eslintrc)|(\.eslintrc\.)/.test(name)) {
            configFilePath = path.join(lintCacheDir, name);
        }

        if (/\.eslintignore/.test(name)) {
            ignorePath = path.join(lintCacheDir, name);
        }
    });

    // get user config file
    targetFiles.forEach((name) => {
        if (/(\.eslintrc)|(.eslintrc\.)/.test(name)) {
            configFilePath = path.join(target, name);
        }
        if (/\.eslintignore/.test(name)) {
            ignorePath = path.join(target, name);
        }
    });

    return {
        configFilePath,
        ignorePath,
    };
}

function remove(target) {
    if (fs.existsSync(target)) {
        fse.removeSync(target);
    }
}

function clearCacheDir(lintCacheDir, saved) {
    fs.readdirSync(lintCacheDir).forEach((filename) => {
        if (saved.indexOf(filename)) {
            fse.removeSync(path.join(lintCacheDir, filename));
        }
    });
}

function createSymlink(src, target) {
    if (fs.existsSync(target)) {
        fse.removeSync(target);
    }
    fse.ensureSymlinkSync(src, target);
}

function rewriteTargetPkg(target, { configFilePath, ignorePath, argString }) {
    const pkgObj = {
        name: 'lint-cache',
        scripts: {
            lint: `eslint ${target} -c ${configFilePath} --ignore-path ${ignorePath} --ext .js,.vue,.jsx`,
        },
    };

    if (argString) {
        pkgObj.scripts.lint += ` ${argString}`;
    }

    const pkgFilePath = path.join(target, 'package.json');

    if (fs.existsSync(pkgFilePath)) {
        fse.removeSync(pkgFilePath);
    }

    writePkg(pkgFilePath, pkgObj);
}

function processLintCacheDir(lintCacheDir) {
    // ensure lint cache dir
    fse.ensureDirSync(lintCacheDir);

    // clear cache dir files and target dir
    clearCacheDir(lintCacheDir, ['node_modules', 'workspace']);

    // install lint modules
    ensureModule([
        'eslint',
        'babel-eslint',
        'eslint-config-airbnb-base',
        'eslint-config-vue',
        'eslint-plugin-import',
        'eslint-plugin-vue',
        'eslint-plugin-html',
        'eslint-plugin-react',
    ], lintCacheDir);

    copyTpt(lintCacheDir);
}

function processTargetDir(target, { lintCacheDir, cwd, argString }) {
    // remove target dir
    remove(target);

    // sync files to target dir
    syncDirectory(cwd, target, {
        exclude: /(\/node_modules\/)/,
    });

    // create node_modules symlink to target dir
    createSymlink(path.join(lintCacheDir, 'node_modules'), path.join(target, 'node_modules'));

    const { configFilePath, ignorePath } = getConfigFilePath(lintCacheDir, target);

    // rewrite target dir package.json
    rewriteTargetPkg(target, { configFilePath, ignorePath, argString });
}

/**
 * @func
 * @desc lint
 */
module.exports = (argString = '') => {
    const cwd = process.cwd();
    const lintCacheDir = path.join(pathUtil.cacheFolder, 'bio-lint');
    const target = path.join(lintCacheDir, 'workspace', md5(cwd), path.basename(cwd));

    processLintCacheDir(lintCacheDir);

    processTargetDir(target, { lintCacheDir, cwd, argString });

    child.execSync(`cd ${target} && npm run lint`, {
        stdio: 'inherit',
    });
};
