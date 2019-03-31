const fs = require('fs');
const path = require('path');
const pluginUtil = require('../util');

const logUtil = require('../../../tool/log');

module.exports = ({ pluginName }) => {
    const fullPluginName = pluginUtil.getFullPluginName(pluginName);
    const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();

    if (!fs.existsSync(path.join(installedPluginsFolder, 'node_modules', fullPluginName))) {
        logUtil.logYellow(`${fullPluginName.green} not exists at local...`);
        return;
    }

    logUtil.start(`removing ${fullPluginName.green}`);
    require('child_process').execSync(`cd ${installedPluginsFolder} && npm uninstall ${fullPluginName} --save --silent`);
    logUtil.succeed(`${fullPluginName.green} removed!`).stop();
};

