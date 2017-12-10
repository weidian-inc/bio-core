/**
 * @file
 * @desc scaffold handlers
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const fse = require('fs-extra');
const mergeDirs = require('merge-dirs');

const pathUtil = require('./path');
const npm = require('./npm');

const getNpmPackageVersion = require('get-npm-package-version');

const createExecPackageJsonFile = (execInstallFolder, scaffoldName) => {
    const pkgJsonPath = path.join(execInstallFolder, 'package.json');

    fse.ensureFileSync(pkgJsonPath);
    fse.writeFileSync(pkgJsonPath, JSON.stringify({
        name: `installing-${scaffoldName}`,
        version: '1.0.0',
    }));
};

const getMaps = (() => {
    let shortNameMap = null;
    let fullNameMap = null;

    return (scaffoldList) => {
        if (shortNameMap && fullNameMap) {
            return {
                shortNameMap,
                fullNameMap,
            };
        }

        shortNameMap = {};
        scaffoldList.forEach((item) => {
            shortNameMap[item.fullName] = item.value;
        });

        fullNameMap = {};
        scaffoldList.forEach((item) => {
            fullNameMap[item.value] = item.fullName;
        });

        return {
            shortNameMap,
            fullNameMap,
        };
    };
})();

module.exports = {
    preInstall() {},

    getFullName(scaffoldName) {
        const maps = getMaps(this.scaffoldList);
        const { fullNameMap } = maps;

        return fullNameMap[scaffoldName] ? fullNameMap[scaffoldName] : scaffoldName;
    },

    getShortName(scaffoldName) {
        const maps = getMaps(this.scaffoldList);
        const { shortNameMap } = maps;

        return shortNameMap[scaffoldName] ? shortNameMap[scaffoldName] : scaffoldName;
    },

    scaffoldList: [], // TODO: add default scaffolds

    /**
     * @func
     * @desc get scaffold name for current project from config file
     * @param {String} cwd: current project dir path
     * @return {String} scaffold name
     */
    getScaffoldName(cwd) {
        const { configName } = pathUtil;
        const configPath = path.join(cwd, configName);

        const content = fs.readFileSync(configPath).toString();

        const contentObj = JSON.parse(content);

        return contentObj.scaffold;
    },

    /**
     * @func
     * @desc ensure scaffold latest
     * @param {String} scaffoldName
     */
    ensureScaffoldLatest(scaffoldName) {
        if (!this.isScaffoldExists(scaffoldName)) {
            console.log(`installing scaffold ${scaffoldName}...`);
            this.installScaffold(scaffoldName);
            console.log(`scaffold ${scaffoldName} installed successfully`);
            return;
        }

        if (this._isScaffoldOutdate(scaffoldName)) {
            console.log(`updating scaffold ${scaffoldName}...`);
            this.installScaffold(scaffoldName);
            console.log(`scaffold ${scaffoldName} updated successfully`);
        }
    },

    /**
     * @func
     * @desc check whether scaffold exists
     * @param {String} scaffoldName
     * @return {Boolean}
     */
    isScaffoldExists(scaffoldName) {
        const pkg = path.join(pathUtil.getScaffoldFolder(scaffoldName), 'package.json');
        if (!fs.existsSync(pkg)) {
            console.log(`\n${scaffoldName}/package.json is not found at local\n`);
            return false;
        }

        return true;
    },

    /**
     * @func
     * @private
     * @desc check whether scaffold is outdated
     * @param {String} scaffoldName
     * @return {Boolean}
     */
    _isScaffoldOutdate(scaffoldName) {
        const packagejsonFilePath = path.join(pathUtil.getScaffoldFolder(scaffoldName), 'package.json');

        const obj = JSON.parse(fs.readFileSync(packagejsonFilePath).toString());

        const currentVersion = obj.version;
        const latestVersion = getNpmPackageVersion(scaffoldName, { registry: npm.scaffoldRegistry, timeout: 2000 });

        if (latestVersion) {
            if (currentVersion !== latestVersion) {
                return true;
            }
            return false;
        }

        return false;
    },

    /**
     * @func
     * @desc install scaffold
     * @param {String} scaffoldName
     */
    installScaffold(scaffoldName) {
        const execInstallFolder = pathUtil.getScaffoldExecInstallFolder(scaffoldName);
        const scaffoldFolder = pathUtil.getScaffoldFolder(scaffoldName);
        const scaffoldWrapper = pathUtil.getScaffoldWrapper(scaffoldName);

        // ensure exec dir
        fse.ensureDirSync(execInstallFolder);

        // ensure package.json exists
        createExecPackageJsonFile(execInstallFolder, scaffoldName);
        this.preInstall(execInstallFolder);

        require('child_process').execSync(`cd ${execInstallFolder} && npm --registry ${npm.scaffoldRegistry} install ${scaffoldName}@latest`, {
            stdio: 'inherit',
        });

        if (fs.existsSync(scaffoldFolder)) {
            fse.removeSync(scaffoldFolder);
        }

        // move node_modules
        fse.moveSync(path.join(execInstallFolder, 'node_modules', scaffoldName), path.join(scaffoldWrapper, scaffoldName), {
            overwrite: true,
        });

        // merge node_modules
        console.log('merging node_modules...');
        mergeDirs.default(path.join(execInstallFolder, 'node_modules'), path.join(scaffoldFolder, 'node_modules'), 'overwrite');
        console.log('merge node_modules done.');

        // remove exec dir
        fse.removeSync(execInstallFolder);
    },
};
