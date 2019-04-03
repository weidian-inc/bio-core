/**
 * @file
 * @desc init project
 * @author https://github.com/hoperyy
 * @date  2018/08/11
 */

const fs = require('fs');
const path = require('path');

const fileUtil = require('../../tool/file');
const scaffoldUtil = require('../../tool/scaffold');

const fse = require('fs-extra');
const inquirer = require('inquirer');

const getTemplateDirPath = (scaffoldName) => {
    return new Promise(resolve => {
        const scaffoldFolder = scaffoldUtil.getScaffoldFolder(scaffoldName);
        const demoFolder = path.join(scaffoldFolder, 'project-template');

        const templateNames = [];

        if (fs.existsSync(demoFolder)) {
            fs.readdirSync(demoFolder).forEach((filename) => {
                templateNames.push(filename);
            });
        }

        if (templateNames.length === 0) {
            resolve('');
        } else if (templateNames.length === 1) {
            resolve(path.join(demoFolder, templateNames[0]));
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
                resolve(path.join(demoFolder, chosenTemplateName));
            });
        }
    });
};

/**
 * @func
 * @desc download template to current dir
 * @param {String} current dir path
 * @param {String} scaffoldName scaffold name(full name)
 */
const downloadTemplate = async function(cwd, scaffoldName) {
    // ensure latest scaffold
    scaffoldUtil.ensureScaffoldLatest(scaffoldName);

    // get demo from scaffold
    const targetTemplateDirPath = await getTemplateDirPath(scaffoldName);
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

module.exports = async ({ ignored = [/readme\.md/i], scaffoldName = 'bio-project-templates' } = {}) => {
    const cwd = process.cwd();

    let chosenScaffoldName = scaffoldName;

    const fullScaffoldName = scaffoldUtil.getFullName(chosenScaffoldName);

    if (fileUtil.isEmptyDir({ dir: cwd, ignored })) {
        const isSuccessful = await downloadTemplate(cwd, fullScaffoldName);
        fileUtil.renameInvisableFiles(cwd);

        if (!isSuccessful) {
            return;
        }

        console.log(`Init project with scaffold ${fullScaffoldName.green} successfully!`);
    }
};
