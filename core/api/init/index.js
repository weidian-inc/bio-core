/**
 * @file
 * @desc init project
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const fileUtil = require('../../tool/file');
const pathUtil = require('../../tool/path');
const scaffoldUtil = require('../../tool/scaffold');

const co = require('co');
const fse = require('fs-extra');
const inquirer = require('inquirer');

const writeConfigFile = function writeConfigFile({ scaffoldName, cwd }) {
    const configFilePath = path.join(cwd, pathUtil.configName);

    // write cache file
    fileUtil.writeFileSync(configFilePath, JSON.stringify({
        scaffold: scaffoldUtil.getFullName(scaffoldName),
    }, null, '\t'));
};

/**
 * @thunk function
 * @desc get template path
 * @param {String} scaffoldName scaffold name(full name)
 * @return {String} template path
 */
const getTemplateDirPath = (scaffoldName) => {
    return (done) => {
        const scaffoldFolder = pathUtil.getScaffoldFolder(scaffoldName);
        const demoFolder = path.join(scaffoldFolder, 'project-template');

        const templateNames = [];

        if (fs.existsSync(demoFolder)) {
            fs.readdirSync(demoFolder).forEach((filename) => {
                templateNames.push(filename);
            });
        }

        if (templateNames.length === 0) {
            done(null, '');
        } else if (templateNames.length === 1) {
            done(null, path.join(demoFolder, templateNames[0]));
        } else {
            // ask user to choose demo
            inquirer.prompt([{
                type: 'list',
                name: 'chosen',
                message: 'choose demo',
                choices: templateNames,
            }]).then((answers) => {
                const chosenTemplateName = answers.chosen;

                console.log('\nThe chosen demo: ', chosenTemplateName.green);

                done(null, path.join(demoFolder, chosenTemplateName));
            });
        }
    };
};

/**
 * @func
 * @desc download template to current dir
 * @param {String} current dir path
 * @param {String} scaffoldName scaffold name(full name)
 */
const downloadTemplate = function* downloadTemplate(cwd, scaffoldName) {
    // ensure latest scaffold
    scaffoldUtil.ensureScaffoldLatest(scaffoldName);

    // get demo from scaffold
    const targetTemplateDirPath = yield getTemplateDirPath(scaffoldName);
    if (targetTemplateDirPath === '') {
        console.log(`Scaffold ${scaffoldName} does not has demo files, please contact the scaffold author to add demo files.`);
        return;
    }

    // copy template to cwd
    fse.copySync(targetTemplateDirPath, cwd, {
        overwrite: true,
        errorOnExist: false,
    });
};

const choseScaffold = () => {
    return (done) => {
        inquirer.prompt([{
            type: 'list',
            name: 'scaffoldName',
            message: 'Select init style',
            choices: scaffoldUtil.scaffoldList,
        }]).then((answers) => {
            done(null, scaffoldUtil.getFullName(answers.scaffoldName));
        });
    };
};

/**
 * @func
 * @desc init project
 * @param {Object}
 * @param {String/RegExp/Array} object.ignored will be used when testing if dir is empty. 'null' by default
 * @param {String} object.scaffoldName: scaffold name(full name)
 */
module.exports = ({ ignored = [pathUtil.configName, /readme\.md/i], scaffoldName = '' } = {}) => {
    const cwd = process.cwd();

    return co(function* init() {
        let chosenScaffoldName = scaffoldName;

        if (!chosenScaffoldName) {
            chosenScaffoldName = yield choseScaffold();
        }

        const fullScaffoldName = scaffoldUtil.getFullName(chosenScaffoldName);

        // write cache file to store init infomation
        writeConfigFile({ scaffoldName: fullScaffoldName, cwd });

        if (fileUtil.isEmptyDir({ dir: cwd, ignored })) {
            yield downloadTemplate(cwd, fullScaffoldName);
            fileUtil.renameInvisableFiles(cwd);
        }

        // run npm install
        console.log('\nnpm installing...\n');
        require('child_process').execSync(`cd ${cwd} && npm install`, {
            stdio: 'inherit'
        });

        console.log('\nInit project successfully!\n');
    });
};
