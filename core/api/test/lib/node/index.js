const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');

const cwd = process.cwd();

const util = require('../../util');

const TEST_SCRIPT_NAME = 'test';
const TEST_DIR_NAME = 'test';
const TEST_DEMO_FILE_NAME = 'demo.spec.js';

const TEST_DIR = path.join(cwd, TEST_DIR_NAME);

const setNewTestScriptName = (name) => {
    return (done) => {
        inquirer.prompt([{
            type: 'confirm',
            name: TEST_SCRIPT_NAME,
            message: `script "${TEST_SCRIPT_NAME.green}" is found at "package.json/scripts", do you want to rename it?`
        }]).then((answers) => {
            if (answers.confirm) {
                done(null, TEST_SCRIPT_NAME);
            } else {
                inquirer.prompt([{
                    type: 'input',
                    name: 'newTestName',
                    message: 'new script name',
                    default: 'test'
                }]).then((answers) => {
                    done(null, answers.newTestName);
                });
            }
        });
    };
};

const existsTestFiles = (dirPath) => {
    const files = fs.readdirSync(dirPath);

    for (let i = 0, len = files.length; i < len; i++) {
        if (/\.spec\.js/.test(files[i])) {
            return true;
        }
    }

    return false;
};

module.exports = {
    * init() {
        const pkgPath = path.join(cwd, 'package.json');

        // check package.json exists
        if (!fs.existsSync(pkgPath)) {
            console.log('\nFile "package.json" is not found (needed)\n'.red);
            return;
        }

        // check package.json
        try {
            require(pkgPath);
        } catch (err) {
            console.log(`\n"JSON.parse" package.json content failed：${err}\n`.red);
            return;
        }

        const pkgObj = require(pkgPath);

        // add scripts
        if (!pkgObj.scripts) {
            pkgObj.scripts = {};
        }

        // ask new script name
        // console.log('\npackage.json "scripts"\n');
        const testScriptName = pkgObj.scripts[TEST_SCRIPT_NAME] ? yield setNewTestScriptName() : TEST_SCRIPT_NAME;
        pkgObj.scripts[testScriptName] = 'istanbul cover _mocha test/*';

        // rewite package.json
        // add nyc
        console.log(`\n"${testScriptName.green}" was added in "package.json/scripts"\n`);

        fs.writeFileSync(pkgPath, JSON.stringify(pkgObj, null, 4));

        fse.ensureDirSync(TEST_DIR);

        // write demo
        if (!existsTestFiles(TEST_DIR)) {
            fse.copySync(path.join(__dirname, `./demo/${TEST_DEMO_FILE_NAME}`), path.join(TEST_DIR, TEST_DEMO_FILE_NAME));
        }

        util.ensureModule([
            'chai',
            'istanbul',
            'mocha',
        ], cwd);

        console.log('');
        console.log([
            'node unitest confiuration done!',
            '',
            `1. run test: npm run ${testScriptName}`,
            `2. test dir: ${'./test/'}`
        ].join('\n').green);
        console.log('');
    }
};
