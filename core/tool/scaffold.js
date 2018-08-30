/**
 * @file
 * @desc scaffold handlers
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const fse = require('fs-extra');

const pathUtil = require('./path');
const fileUtil = require('./file');
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
    preInstall() {},

    writeScaffoldConfigFile({ scaffoldName }) {
        const cwd = process.cwd();

        /**
         * 1. .biorc will be read firstly
         * 2. package.json "bio-scaffold" will be read secondly
         */
        const stage0Config = path.join(cwd, pathUtil.configName);
        const stage1Config = path.join(cwd, 'package.json');

        const writeFile = () => {
            fileUtil.writeFileSync(stage0Config, JSON.stringify({
                scaffold: this.getFullName(scaffoldName),
            }, null, '\t'));
        };

        if (fs.existsSync(stage0Config)) {
            writeFile();
        } else { // then write package.json
            if (fs.existsSync(stage1Config)) {
                const pkgContent = fs.readFileSync(stage1Config, 'utf-8');

                try {
                    const obj = JSON.parse(pkgContent);
                    obj['bio-scaffold'] = scaffoldName;
                    fs.writeFileSync(stage1Config, JSON.stringify(obj, null, '\t'));
                } catch (err) {
                    writeFile();
                }
            } else {
                writeFile();
            }
        }
    },

    getScaffoldNameFromConfigFile() {
        const cwd = process.cwd();
        let scaffoldName = '';

        const stage0Config = path.join(cwd, pathUtil.configName);
        const stage1Config = path.join(cwd, 'package.json');

        // prefer .biorc
        try {
            scaffoldName = JSON.parse(fs.readFileSync(stage0Config).toString()).scaffold;
        } catch (err) {
            // eslint-disable-no-empty
        }

        // then get package.json "bio-scaffold"
        if (!scaffoldName) {
            try {
                scaffoldName = JSON.parse(fs.readFileSync(stage1Config).toString())['bio-scaffold'];
            } catch (err) {
                // eslint-disable-no-empty
            }
        }

        if (!scaffoldName) {
            console.log('\nno scaffold info found at current directory\n'.red);
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
        // move cached scaffold file, if exists
        this.moveScaffoldCache(scaffoldName);

        if (!this.isScaffoldExists(scaffoldName)) {
            console.log(`installing scaffold ${scaffoldName}...`);
            this.installScaffold(scaffoldName, { async: false });
            console.log(`scaffold ${scaffoldName} installed successfully`);
            return;
        }

        if (this._isScaffoldOutdate(scaffoldName)) {
            console.log(`\nupdating scaffold ${scaffoldName}...\n`);
            this.installScaffold(scaffoldName, { async: false });
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
            const latestVersion = getNpmPackageVersion(scaffoldName, { registry: npm.scaffoldRegistry, timeout: 2000 });

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
        const execInstallFolder = pathUtil.getScaffoldExecInstallFolder(scaffoldName);
        const scaffoldFolder = pathUtil.getScaffoldFolder(scaffoldName);
        const scaffoldWrapper = pathUtil.getScaffoldWrapper(scaffoldName);

        const srcScaffold = path.join(execInstallFolder, 'node_modules', scaffoldName);
        const srcScaffoldDep = path.join(execInstallFolder, 'node_modules');

        if (!fs.existsSync(srcScaffold) || !fs.existsSync(srcScaffoldDep)) {
            return;
        }

        if (fs.existsSync(scaffoldFolder)) {
            fse.removeSync(scaffoldFolder);
        }

        // move scaffold
        console.log('move scaffold: ', srcScaffold, path.join(scaffoldWrapper, scaffoldName), scaffoldFolder);
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
        console.log('installing dependencies...');
        require('child_process').execSync(`cd ${scaffoldFolder} && npm i --registry ${npm.scaffoldRegistry}`, {
            stdio: 'inherit'
        });

        fse.removeSync(execInstallFolder);
    },

    /**
     * @func
     * @desc install scaffold
     * @param {String} scaffoldName
     */
    installScaffold(scaffoldName, options) {
        const { async } = options;
        const execInstallFolder = pathUtil.getScaffoldExecInstallFolder(scaffoldName);
        const child = require('child_process');

        const hopedVersion = this.getHopedVersion(scaffoldName);

        // ensure exec dir
        fse.ensureDirSync(execInstallFolder);

        // ensure package.json exists
        createExecPackageJsonFile(execInstallFolder, scaffoldName);
        this.preInstall(execInstallFolder);

        const order = `cd ${execInstallFolder} && npm --registry ${npm.scaffoldRegistry} install ${scaffoldName}@${hopedVersion} --no-optional`;

        if (async) {
            child.exec(order, (error) => {
                if (error) {
                    // remove exec dir
                    fse.removeSync(execInstallFolder);
                    return;
                }

                console.log(`scaffold "${scaffoldName}" updated successfully!`);
            });
        } else {
            try {
                child.execSync(order, {
                    stdio: 'inherit',
                });

                this.moveScaffoldCache(scaffoldName);
            } catch (err) {
                console.log(`\nError occurred when "npm --registry ${npm.scaffoldRegistry} install ${scaffoldName}@${hopedVersion}"\n`.red);
                process.exit(1);
            }
        }
    },
};
