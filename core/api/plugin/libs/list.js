const fs = require('fs');
const path = require('path');
const pluginUtil = require('../util');
const logUtil = require('../../../tool/log');

const pushOnePluginToPluginList = (pluginFolder, pluginList, tag) => {
    const pkgJsonFile = path.join(pluginFolder, 'package.json');
    const name = pluginFolder.split(path.sep).pop();

    if (!fs.existsSync(pkgJsonFile)) {
        return;
    }

    let jsonObj = null;

    try {
        jsonObj = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf8'));
    } catch(err) {
        pluginList.push({
            name,
            description: jsonObj.description,
            author: jsonObj.author || '未知',
            broken: true,
            tag
        });
        return;
    } 

    if (jsonObj) {
        pluginList.push({
            name: jsonObj.name,
            description: jsonObj.description,
            author: jsonObj.author || '未知',
            broken: false,
            tag
        });
    }
};

const pushInstalledPlugins = (pluginList) => {
    const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();
    const pluginsWrapper = path.join(installedPluginsFolder, 'node_modules/@vdian');

    if (!fs.existsSync(pluginsWrapper)) {
        return;
    }

    fs.readdirSync(pluginsWrapper).forEach(dirname => {
        if (!/bio-plugin-/.test(dirname)) {
            return;
        }

        if (!fs.existsSync(path.join(pluginsWrapper, dirname, 'index.js'))) {
            return;
        }

        pushOnePluginToPluginList(path.join(pluginsWrapper, dirname), pluginList, '已安装');
    });
};

const pushLinkedPlugins = (pluginList) => {
    const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();

    if (fs.existsSync(linkedPluginsFolder)) {
        fs.readdirSync(linkedPluginsFolder).forEach(hashedName => {
            let pluginFolderName = '';

            const hashedPluginFolder = path.join(linkedPluginsFolder, hashedName);
                  
            if (fs.existsSync(hashedPluginFolder)) {
                  fs.readdirSync(hashedPluginFolder).forEach(dirname => {
                      if (pluginFolderName) {
                          return;
                      }

                      const pluginFolder = path.join(hashedPluginFolder, dirname);
                      const indexFile = path.join(pluginFolder, 'index.js');

                      if (fs.existsSync(indexFile)) {
                          pluginFolderName = dirname;
                      }
                  });
              }

              if (pluginFolderName) {
                  pushOnePluginToPluginList(path.join(hashedPluginFolder, pluginFolderName), pluginList, '本地 link');
              }
        });
    }
};

module.exports = () => {
    const pluginList = [];  
    
    pushInstalledPlugins(pluginList);
    pushLinkedPlugins(pluginList);

    const logContentArr = [];
    pluginList.forEach(pluginItem => {
        logContentArr.push(
          [
            `${'插件名称:'.green} ${pluginItem.name}`,
            `${'   描述:'.green} ${pluginItem.description}`,
            `${'   作者:'.green}  ${pluginItem.author}`,
            `${'   当前状态:'.green} ${pluginItem.tag}`
          ].join('\n'));
      });

    if (logContentArr.length) {
        logUtil.logGreen('插件如下：\n');
        console.log(logContentArr.map((item, index) => `${index}. ${item}`).join('\n'));
    } else {
        logUtil.logGreen('目前没有安装任何插件');
    }
};

