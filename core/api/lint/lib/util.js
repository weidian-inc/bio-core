const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const { green } = require('chalk');

function ensureModule(packageNames, cwd) {
    if (!fs.existsSync(path.join(cwd, 'package.json'))) {
        // console.log(red(`\npackage.json is not found, skip installing dependencies (via 'npm install'): \n\n-- ${packageNames.join('\n-- ')}\n`));
        console.log('\nlint configuration was stopped because there is no formated package.json file found here.\n'.red);
        process.exit(1);
    }

    const uninstalled = [];
    packageNames.forEach((packageName) => {
        try {
            require(path.join(cwd, 'node_modules', packageName));
        } catch (err) {
            uninstalled.push(`${packageName}@latest`);
        }
    });

    if (uninstalled.length) {
        console.log('\ninstalling dependencies.\n');
        require('child_process').execSync(`cd ${cwd} && npm install ${uninstalled.join(' ')} --save-dev`, {
            stdio: 'inherit',
        });
        console.log('\ninstallation done.\n');
    }

    return 0;
}

function confirm(fileName) {
    return (done) => {
        inquirer.prompt([{
            type: 'confirm',
            name: 'cover',
            message: `Cover previous file ? ${fileName}`,
        }]).then(answers => {
            done(null, answers.cover);
        });
    }
}

function* copyTpt(tptDir, targetDir) {
    const tptFiles = fs.readdirSync(tptDir);
    let fileName;

    for (let i = 0, len = tptFiles.length; i < len; i++) {
        fileName = tptFiles[i];
        const targetFile = path.join(targetDir, fileName);
        if (fs.existsSync(targetFile)) {
            const shouldCover = yield confirm(fileName);
            if (shouldCover) {
                fse.copySync(path.join(tptDir, fileName), targetFile);
                console.log(green(`${fileName} covered.`));
            }
        } else {
            fse.copySync(path.join(tptDir, fileName), targetFile);
            console.log(green(`${fileName} created.`));
        }
    }
}

module.exports = {
    ensureModule,
    copyTpt,
};