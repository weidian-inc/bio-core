const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const inquirer = require('inquirer');

const cwd = process.cwd();

const util = require('../../util');

const TEST_SCRIPT_NAME = 'test';
const TEST_DIR_NAME = 'test';
const TEST_DEMO_FILE_NAME = 'demo.spec.ts';

const MOCHA_OPTS_FILE = 'mocha.opts';

const TEST_DIR = path.join(cwd, TEST_DIR_NAME);

const setNewTestScriptName = () => {
    return (done) => {
        inquirer.prompt([{
            type: 'confirm',
            name: TEST_SCRIPT_NAME,
            message: `script ${TEST_SCRIPT_NAME} is found at "package.json/scripts", do you want it be covered?`
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
        if (/\.spec\.ts/.test(files[i])) {
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
        console.log('\npackage.json "scripts"\n');
        const testScriptName = pkgObj.scripts[TEST_SCRIPT_NAME] ? yield setNewTestScriptName() : TEST_SCRIPT_NAME;
        pkgObj.scripts[testScriptName] = 'nyc mocha && open coverage/index.html';

        // rewite package.json
        // add nyc
        console.log(`\n"${testScriptName.green}" was added in "package.json/scripts"\n`);
        pkgObj.nyc = {
            "extension": [
                ".ts",
                ".tsx"
            ],
            "exclude": [
                "**/*.d.ts",
                "coverage/**",
                "test/**"
            ],
            "reporter": [
                "text-summary",
                "html"
            ],
            "all": true
        };

        fs.writeFileSync(pkgPath, JSON.stringify(pkgObj, null, 4));

        fse.ensureDirSync(TEST_DIR);

        // write demo
        if (!existsTestFiles(TEST_DIR)) {
            fse.copySync(path.join(__dirname, `./demo/${TEST_DEMO_FILE_NAME}`), path.join(TEST_DIR, TEST_DEMO_FILE_NAME));
        }

        if (!fs.existsSync(path.join(TEST_DIR, MOCHA_OPTS_FILE))) {
            fse.copySync(path.join(__dirname, `demo/${MOCHA_OPTS_FILE}`), path.join(TEST_DIR, MOCHA_OPTS_FILE));
        }

        util.ensureModule([
            '@types/chai',
            '@types/mocha',
            'chai',
            'mocha',
            'nyc',
            'rewire',
            'source-map-support',
            'supertest',
            'ts-node',
            'typescript'
        ], cwd);

        console.log('');
        console.log([
            'typescript unitest confiuration done!',
            '',
            `1. run test: npm run ${testScriptName}`,
            `2. test dir: ${'./test/'}`
        ].join('\n').green);
        console.log('');
    }
};
