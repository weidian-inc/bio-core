const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const { red, green } = require('chalk');

function ensureModule(packageNames, cwd) {
    if (!fs.existsSync(path.join(cwd, 'package.json'))) {
        console.log(red(`\npackage.json is not found, skip installing dependencies (via 'npm install'): \n\n-- ${packageNames.join('\n-- ')}\n`));
        return;
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
}

module.exports = {
    ensureModule,
};