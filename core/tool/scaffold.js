/**
 * @file
 * @desc scaffold handlers
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const fse = require('fs-extra');

const md5 = require('md5');

const pathUtil = require('./path');
const logUtil = require('./log');
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
    let shortKeyMap = null;
    let fullKeyMap = null;

    return (scaffoldList) => {
        if (shortKeyMap && fullKeyMap) {
            return {
                shortKeyMap,
                fullKeyMap,
            };
        }

        fullKeyMap = {};
        scaffoldList.forEach((item) => {
            fullKeyMap[item.fullName] = {
                otherName: item.value,
                version: item.version,
            };
        });

        shortKeyMap = {};
        scaffoldList.forEach((item) => {
            shortKeyMap[item.value] = {
                otherName: item.fullName,
                version: item.version,
            };
        });

        return {
            shortKeyMap,
            fullKeyMap,
        };
    };
})();

module.exports = {
    beforeScaffoldInstall() {},

    writeScaffoldInConfigFile({ scaffoldName }) {
        const cwd = process.cwd();
        const pkgJsonFile = path.join(cwd, 'package.json');

        // write package.json
        if (fs.existsSync(pkgJsonFile)) {
            const pkgContent = fs.readFileSync(pkgJsonFile, 'utf-8');

            try {
                const obj = JSON.parse(pkgContent);
                obj['bio-scaffold'] = scaffoldName;
                fs.writeFileSync(pkgJsonFile, JSON.stringify(obj, null, '\t'));
            } catch (err) {
                // eslint-disable-no-empty
            }
        }
    },

    getScaffoldNameFromConfigFile() {
        const cwd = process.cwd();
        let scaffoldName = '';
        const pkgJsonFile = path.join(cwd, 'package.json');

        // get package.json "bio-scaffold"
        try {
            scaffoldName = JSON.parse(fs.readFileSync(pkgJsonFile).toString())['bio-scaffold'];
        } catch (err) {
            // eslint-disable-no-empty
        }

        if (!scaffoldName) {
            console.log('\nno scaffold info found in package.json\n'.red);
        }

        return scaffoldName;
    },

    getFullName(scaffoldName) {
        const maps = getMaps(this.scaffoldList);
        const { shortKeyMap } = maps;

        return shortKeyMap[scaffoldName] ? shortKeyMap[scaffoldName].otherName : scaffoldName;
    },

    getShortName(scaffoldName) {
        const maps = getMaps(this.scaffoldList);
        const { fullKeyMap } = maps;

        return fullKeyMap[scaffoldName] ? fullKeyMap[scaffoldName].otherName : scaffoldName;
    },

    getHopedVersion(scaffoldName) {
        const maps = getMaps(this.scaffoldList);
        const fullName = this.getFullName(scaffoldName);
        const hopedVersion = maps.fullKeyMap[fullName] ? maps.fullKeyMap[fullName].version : 'latest';

        return hopedVersion;
    },

    scaffoldList: [], // TODO: add default scaffolds

    /**
     * @func
     * @desc ensure scaffold latest
     * @param {String} scaffoldName
     */
    ensureScaffoldLatest(scaffoldName) {
        // move cached scaffold file, if exists
        this.moveScaffoldCache(scaffoldName);

        if (!this.isScaffoldExists(scaffoldName)) {
            logUtil.start(`installing scaffold ${scaffoldName}...`);
            this.installScaffold(scaffoldName, { async: false });
            logUtil.stop();
            return;
        }

        if (this._isScaffoldOutdate(scaffoldName)) {
            logUtil.start(`updating scaffold ${scaffoldName}...`);
            this.installScaffold(scaffoldName, { async: false });
            logUtil.stop();
        }
    },

    /**
     * @func
     * @desc check whether scaffold exists
     * @param {String} scaffoldName
     * @return {Boolean}
     */
    isScaffoldExists(scaffoldName) {
        const pkg = path.join(this.getScaffoldFolder(scaffoldName), 'package.json');
        if (!fs.existsSync(pkg)) {
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

        const packagejsonFilePath = path.join(this.getScaffoldFolder(scaffoldName), 'package.json');

        const obj = JSON.parse(fs.readFileSync(packagejsonFilePath).toString());

        const currentVersion = obj.version;

        const hopedVersion = this.getHopedVersion(scaffoldName);

        if (hopedVersion !== 'latest') {
            if (hopedVersion !== currentVersion) {
                console.log(`\nscaffold ${scaffoldName} is outdated, details as below:\n`);
                console.log('   - scaffoldName: ', scaffoldName);
                console.log('   - currentVersion: ', currentVersion);
                console.log('   - hopedVersion: ', hopedVersion);
                return true;
            } else {
                return false;
            }
        } else {
            const latestVersion = getNpmPackageVersion(scaffoldName, { registry: npm.registry, timeout: 2000 });

            if (latestVersion) {
                if (currentVersion !== latestVersion) {
                    console.log(`\nscaffold ${scaffoldName} is outdated, details as below:\n`);
                    console.log('  - scaffoldName: ', scaffoldName);
                    console.log('  - currentVersion: ', currentVersion);
                    console.log('  - hopedVersion: ', hopedVersion, latestVersion, '\n');
                    return true;
                }
                return false;
            }

            return false;
        }
    },

    moveScaffoldCache(scaffoldName) {
        const execInstallFolder = this.getScaffoldExecInstallFolder(scaffoldName);
        const scaffoldFolder = this.getScaffoldFolder(scaffoldName);

        const srcScaffold = path.join(execInstallFolder, 'node_modules', scaffoldName);
        const srcScaffoldDep = path.join(execInstallFolder, 'node_modules');

        if (!fs.existsSync(srcScaffold) || !fs.existsSync(srcScaffoldDep)) {
            return;
        }

        if (fs.existsSync(scaffoldFolder)) {
            fse.removeSync(scaffoldFolder);
        }

        // move scaffold
        fse.moveSync(srcScaffold, scaffoldFolder, {
            overwrite: true,
        });

        ['package-lock.json', 'package.json'].forEach(name => {
            const src = path.join(scaffoldFolder, `.${name}`);
            const target = path.join(scaffoldFolder, name);

            if (fs.existsSync(src)) {
                if (fs.existsSync(target)) {
                    fse.removeSync(target);
                }
                fse.copySync(src, target);
            }
        });

        // run npm install
        logUtil.start('installing dependencies...');
        require('child_process').execSync(`cd ${scaffoldFolder} && npm i --registry ${npm.registry} --silent`);
        logUtil.stop();

        fse.removeSync(execInstallFolder);
    },

    /**
     * @func
     * @desc install scaffold
     * @param {String} scaffoldName
     */
    installScaffold(scaffoldName, options) {
        const { async } = options;
        const execInstallFolder = this.getScaffoldExecInstallFolder(scaffoldName);
        const child = require('child_process');

        const hopedVersion = this.getHopedVersion(scaffoldName);

        // ensure exec dir
        fse.ensureDirSync(execInstallFolder);

        // ensure package.json exists
        createExecPackageJsonFile(execInstallFolder, scaffoldName);

        this.beforeScaffoldInstall(execInstallFolder);

        const order = `cd ${execInstallFolder} && npm --registry ${npm.registry} install ${scaffoldName}@${hopedVersion} --no-optional`;

        if (async) {
            child.exec(order, (error) => {
                if (error) {
                    // remove exec dir
                    fse.removeSync(execInstallFolder);
                    return;
                }
            });
        } else {
            try {
                child.execSync(order, { stdio: 'inherit' });
                this.moveScaffoldCache(scaffoldName);
            } catch (err) {
                console.log(`\nError occurred when "npm --registry ${npm.registry} install ${scaffoldName}@${hopedVersion}"\n`.red);
                process.exit(1);
            }
        }
    },

    /**
     * @func
     * @desc get workspace dir path
     * @param {Object}
     * @param {String} object.cwd: current project path
     * @param {String} object.scaffoldName
     * @return {String} workspace dir path
     */
    getWorkspaceFolder({ cwd, scaffoldName }) {
        const currentDirname = cwd.replace(path.dirname(cwd), '').replace(/^\//, '').replace(/\/$/, '');
        const scaffoldFolder = this.getScaffoldFolder(scaffoldName);
        const workspaceFolder = path.join(scaffoldFolder, 'workspace', md5(cwd), currentDirname);
        return workspaceFolder;
    },

    /**
     * @func
     * @desc get dir path of scaffold wrapper
     * @param {String} scaffoldName
     * @return {String} scaffold wrapper path
     */
    getScaffoldWrapper() {
        return path.join(pathUtil.cacheFolder, 'scaffold');
    },

    /**
     * @func
     * @desc get dir path for execing installing scaffold
     * @param {String} scaffoldName
     * @return {String} dir path for execing installing scaffold
     */
    getScaffoldExecInstallFolder(scaffoldName) {
        return path.join(this.getScaffoldWrapper(scaffoldName), 'tmp-install-cache', `${md5(scaffoldName)}`);
    },

    /**
     * @func
     * @desc get scaffold dir path
     * @param {String} scaffoldName
     * @return {String} scaffold dir path
     */
    getScaffoldFolder(scaffoldName) {
        return path.join(this.getScaffoldWrapper(scaffoldName), scaffoldName);
    },
};
