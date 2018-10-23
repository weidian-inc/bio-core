/**
 * @file
 * @desc init project
 * @author https://github.com/hoperyy
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
const ora = require('ora');

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
        console.log(`\nScaffold "${scaffoldName}" (npm package name) has no demo files. \n\nPlease contact the scaffold author to add demo files or check whether you've input the right scaffold name.\n`.red);
        return false;
    }

    // copy template to cwd
    fse.copySync(targetTemplateDirPath, cwd, {
        overwrite: true,
        errorOnExist: false,
    });

    return true;
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

        if (fileUtil.isEmptyDir({ dir: cwd, ignored })) {
            const isSuccessful = yield downloadTemplate(cwd, fullScaffoldName);
            fileUtil.renameInvisableFiles(cwd);

            if (!isSuccessful) {
                return;
            }

            // write cache file to store init infomation
            scaffoldUtil.writeScaffoldConfigFile({ scaffoldName: fullScaffoldName });

            // run npm install
            const nmpath = path.join(cwd, 'node_modules');
            if (!fs.existsSync(nmpath) || fs.readdirSync(nmpath).length <= 5) {
                const spinner = ora(`${'[bio]'.green} npm install running`).start();

                try {
                    require('child_process').execSync(`cd ${cwd} && npm i --silent`);
                    spinner.succeed(`${'[bio]'.green} npm install done`).stop();
                } catch (err) {
                    spinner.fail(`${'[bio]'.red} npm install failed`).stop();
                }
            }

            console.log(`\nInit project with scaffold ${fullScaffoldName.green} successfully!\n`);
        } else {
            // write cache file to store init infomation
            scaffoldUtil.writeScaffoldConfigFile({ scaffoldName: fullScaffoldName });
            console.log('\nSkip creating project files because there are files exisiting in current directory.'.yellow);
        }
    });
};
