/**
 * @file
 * @desc init project
 * @author https://github.com/hoperyy
 * @date  2018/05/26
 */

const fs = require('fs');
const path = require('path');
const md5 = require('md5');

const childProcess = require('child_process');

const cwd = process.cwd();

const fileUtil = require('../../../tool/file');
const networkUtil = require('../../../tool/network');
const ignoreUtil = require('../_tool/ignore');
const stringUtil = require('../_tool/string-handlers');

const projectCacheDir = require('../_tool/config').projectCacheDir;

const buildProject = require('../_tool/build-project/index');

const projectHandlers = require('../_tool/project-handlers');

const openBrowser = require('react-dev-utils/openBrowser');

class Run {
    constructor({ multi, target, showIndex, port }) {
        const _this = this;
        require('co')(function*() {
            console.log('Preparing...');

            const rootDir = target;

            // 本地服务端口
            _this.localPort = yield networkUtil.getFreePort(port || 35200);

            // livereload 端口
            const livereloadPort = yield networkUtil.getFreePort(35279);

            _this.wrapperDir = path.join(projectCacheDir, multi ? 'serve-muti' : 'serve-single');
            
            const cacheProjectDir = path.join(_this.wrapperDir, 'projects', `${path.basename(rootDir)}-${md5(rootDir)}`);

            // 使用用户设置的 _sidebar.md
            const useUserSidebar = !multi && fs.existsSync(path.join(rootDir, '_sidebar.md'));

            // 自动创建 _sidebar.md
            const autoCreateSidebar = !multi && !fs.existsSync(path.join(rootDir, '_sidebar.md'));

            // 使用用户设置的 _navbar.md
            const useUserNavbar = !multi && fs.existsSync(path.join(rootDir, '_navbar.md'));
            
            // 设置 ignore 字段，并 merge 用户设置的 ignore 字段
            ignoreUtil.init(rootDir);
            stringUtil.init({ showIndex });

            // 初始化 projectHandlers 的初始字段
            projectHandlers.init({ 
                wrapperDir: _this.wrapperDir, 
                rootDir: rootDir, 
                cacheProjectDir,
                showIndex,
                useUserSidebar,
                useUserNavbar,
                multi,
            });

            multi ? projectHandlers.handleMultiProject() : projectHandlers.handleLocalProject();

            buildProject.serve({
                skipSidebar: !autoCreateSidebar,
                projectDir: cacheProjectDir,
            });

            _this._rewritePackageJsonScriptInWrapper(`dev-0`, `./node_modules/.bin/docsify serve '${cacheProjectDir}' -p ${_this.localPort} -P ${livereloadPort}`);

            // lanch server
            _this.lanchServer();
        });
    }

    _rewritePackageJsonScriptInWrapper(scriptName, scriptContent) {
        const pkgPath = path.join(this.wrapperDir, 'package.json');
        const pkgObj = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        // rewrite package.json
        pkgObj.scripts[scriptName] = scriptContent;

        fileUtil.writeFileSync(pkgPath, JSON.stringify(pkgObj, null, '\t'));
    }

    lanchServer() {
        console.log('Preparation done! Lanching server...');

        const pkgObj = JSON.parse(fs.readFileSync(path.join(this.wrapperDir, 'package.json'), 'utf8'));

        Object.keys(pkgObj.scripts).forEach((scriptName) => {
            if (/^dev-/.test(scriptName)) {
                const child = childProcess.exec(`cd ${this.wrapperDir} && npm run ${scriptName}`);

                child.stdout.on('data', function (data) {
                    console.log('stdout: ' + data);
                });
                child.stderr.on('data', function (data) {
                    console.log('stdout: ' + data);
                });
                child.on('close', function (code) {
                    console.log('closing code: ' + code);
                });
            }
        });

        const url = `http://localhost:${this.localPort}/#/`;

        console.log(`open url: ${url.green}`);
        setTimeout(() => {
            openBrowser(url);
        }, 1200);
    }
}

/**
 * @func
 * @desc init project
 * @param {Object}
 * @param {String/RegExp/Array} object.ignored will be used when testing if dir is empty. 'null' by default
 * @param {String} object.scaffoldName: scaffold name(full name)
 */
module.exports = ({ multi, target, showIndex }) => {
    const finalTarget = target ? path.join(cwd, target) : cwd;
    if (fileUtil.isEmptyDir({ dir: finalTarget })) {
        console.log('\nCurrent directory is blank.\n'.yellow);
        return;
    }

    // create whole project
    new Run({ multi, target: finalTarget, showIndex });
};
