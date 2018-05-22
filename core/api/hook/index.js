const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const { yellow } = require('chalk');

const VERSION_FILE = 'version.json';
const HOOKS_DIRNAME = 'hooks';
const HOOKS_OLD_DIRNAME = 'hooks.old';

const HOOKS = [
    'applypatch-msg',
    'commit-msg',
    'post-applypatch',
    'post-checkout',
    'post-commit',
    'post-merge',
    'post-receive',
    'pre-applypatch',
    'pre-auto-gc',
    'pre-commit',
    'pre-push',
    'pre-rebase',
    'pre-receive',
    'prepare-commit-msg',
    'update',
    VERSION_FILE,
];


/**
 * Returns the closest git directory.
 * It starts looking from the current directory and does it up to the fs root.
 * It returns undefined in case where the specified directory isn't found.
 *
 * @param {String} [currentPath] Current started path to search.
 * @returns {String|undefined}
 */
function getClosestGitPath(currentPath = process.cwd()) {
    const dirnamePath = path.join(currentPath, '.git');

    if (fs.existsSync(dirnamePath)) {
        return dirnamePath;
    }

    const nextPath = path.resolve(currentPath, '..');

    if (nextPath === currentPath) {
        return undefined;
    }

    return getClosestGitPath(nextPath);
}

/**
 * if version is up to date, return false
 * if version is too old or versionFile doesn't exist, return true
 * @param {any} templatePath hooks templates
 * @param {any} gitPath hooks installation path
 * @returns {boolean}
 */
function needInstall(templatePath, gitPath) {
    const hooksPath = path.resolve(gitPath, HOOKS_DIRNAME);
    const hooksOldPath = path.resolve(gitPath, HOOKS_OLD_DIRNAME);
    const destVerFile = path.resolve(hooksPath, VERSION_FILE);
    const srcVerFile = path.resolve(templatePath, VERSION_FILE);

    if (fs.existsSync(destVerFile)) {
        const destVer = JSON.parse(fse.readFileSync(destVerFile)).version;
        const srcVer = JSON.parse(fse.readFileSync(srcVerFile)).version;
        if (destVer < srcVer) {
            console.log('updating hook files');
        } else {
            console.log('hook files are up to date');
            return false;
        }
    } else {
        if (fs.existsSync(hooksPath) && !fs.existsSync(hooksOldPath)) {
            fse.renameSync(hooksPath, hooksOldPath);
        }
        console.log('Hook config is finished');
    }
    return true;
}

/**
 * copy hook templates to gitpath
 *
 * @param {any} templatePath
 * @param {any} gitPath
 */
function writeHookFiles(templatePath, gitPath) {
    if (!gitPath) {
        throw new Error('hooks must be added inside a git repository');
    }

    const hooksPath = path.resolve(gitPath, HOOKS_DIRNAME);
    fse.ensureDirSync(hooksPath);
    HOOKS.forEach((hookName) => {
        const hookSrcPath = path.resolve(templatePath, hookName);
        const hookDestPath = path.resolve(hooksPath, hookName);
        if (fs.existsSync(hookSrcPath)) {
            try {
                fse.writeFileSync(hookDestPath, fse.readFileSync(hookSrcPath), { mode: '0777' });
            } catch (e) {
                // node 0.8 fallback
                fse.writeFileSync(hookDestPath, fse.readFileSync(hookSrcPath), 'utf8');
                fse.chmodSync(hookDestPath, '0777');
            }
        }
    });
}

const addHook = ({ preHook, src, dest, afterHook }) => {
    if (preHook) preHook();
    const templatePath = path.resolve(src || __dirname, 'hooks');
    const gitPath = getClosestGitPath(dest);
    if (gitPath == null) {
        console.log(yellow('Current project is not a git project, skip writing hook in "git commit"'));
        return;
    }
    if (needInstall(templatePath, gitPath)) {
        writeHookFiles(templatePath, gitPath);
    }
    if (afterHook) afterHook();
};

module.exports = {
    addHook,
};
