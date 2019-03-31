const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const logUtil = require('../../../tool/log');

const pluginUtil = require('../util');

const ensureNecessaryFiles = () => {
    const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();
    const packageJsonFilePath = path.join(installedPluginsFolder, 'package.json');

    if (fs.existsSync(packageJsonFilePath)) {
        return;
    }

    fse.ensureDirSync(installedPluginsFolder);

    const packageJsonContent = JSON.stringify({
        name: 'qute-plugins',
        description: "qute plugin",
        version: "1.0.0"
    }, null, '\t');

    fse.ensureFileSync(packageJsonFilePath);

    fs.writeFileSync(packageJsonFilePath, packageJsonContent);
};

const installPluginSync = (pluginName, installedPluginsFolder) => {
    logUtil.start(`installing plugin ${pluginName.green}...\n`);
    try {
        require('child_process').execSync(`cd ${installedPluginsFolder} && npm i ${pluginName}`, {
            stdio: 'inherit'
        });
        logUtil.succeed(`plugin ${pluginName.green} installed!`).stop();
        return {
            success: true   
        };
    } catch(err) {
        logUtil.fail(`plugin ${pluginName.yellow} installation failed!`).stop();
        return {
            success: false
        };
    }
};

// const getPluginOrder = (pluginName, installedPluginFolder) => {
    
// };

module.exports = ({ pluginName }) => {
    pluginName = pluginUtil.getFullPluginName(pluginName);
    ensureNecessaryFiles();

    const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();
    installPluginSync(pluginName, installedPluginsFolder);
};

