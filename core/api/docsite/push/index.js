/**
 * @file
 * @desc init project
 * @author https://github.com/hoperyy
 * @date  2018/05/26
 */

const fs = require('fs');
const path = require('path');
const md5 = require('md5');

const projectCacheDir = require('../_tool/config').projectCacheDir;

const cwd = process.cwd();
const projectHandlers = require('../_tool/project-handlers');

const buildProject = require('../_tool/build-project/index');

const ignoreUtil = require('../_tool/ignore');
const stringUtil = require('../_tool/string-handlers');

const logUtil = require('../../../tool/log');

class Push {
    constructor({ multi, showIndex, branch = 'gh-pages' }) {
        const rootDir = cwd;

        if (!fs.existsSync(path.join(rootDir, '.git'))) {
            console.log('\ncurrent directory is not a git project!\n'.red);
            return;
        }

        const wrapperDir = path.join(projectCacheDir, multi ? 'ghpages-multi' : 'ghpages-single');

        const cacheProjectDir = path.join(wrapperDir, `${path.basename(rootDir)}-${md5(rootDir)}`);

        const useUserSidebar = !multi && fs.existsSync(path.join(rootDir, '_sidebar.md'));
        const autoCreateSidebar = !multi && !fs.existsSync(path.join(rootDir, '_sidebar.md'));

        const useUserNavbar = !multi && fs.existsSync(path.join(rootDir, '_navbar.md'));

        // init project
        ignoreUtil.init(rootDir);
        stringUtil.init({ showIndex });
        projectHandlers.init({
            wrapperDir,
            rootDir,
            cacheProjectDir,
            useUserSidebar,
            useUserNavbar,
            env: 'github'
        });

        multi ? projectHandlers.handleMultiProject() : projectHandlers.handleLocalProject();

        buildProject.once({
            skipSidebar: !autoCreateSidebar,
            projectDir: cacheProjectDir,
        });

        this.branch = branch;
        this.cacheProjectDir = cacheProjectDir;

        this.push();
    }

    push() {
        try {
            require('child_process').execSync(`cd ${this.cacheProjectDir} && git add . && git commit -m "update ${Date.now()}" && git push origin master:${this.branch} --force`, {
                stdio: 'inherit',
            });
        } catch(err) {
            logUtil.logRed('push to github failed...');
            process.exit(1);
        }
    }
}

/**
 * @func
 * @desc init project
 * @param {Object}
 * @param {String/RegExp/Array} object.ignored will be used when testing if dir is empty. 'null' by default
 * @param {String} object.scaffoldName: scaffold name(full name)
 */
module.exports = (options) => {
    new Push(options);
};
