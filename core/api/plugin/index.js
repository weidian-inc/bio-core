const fs = require('fs');
const path = require('path');

const pathUtil = require('../../tool/path');

const pluginUtil = require('./util');

module.exports = {
    registPlugin(commander) {
        const _registOnePlugin = (pluginFolder) => {
            const indexFilePath = path.join(pluginFolder, 'index.js');
            try {
                require(indexFilePath)({ 
                    commander, 
                    bioCacheFolder: pathUtil.cacheFolder
                });
            } catch(err) {
              console.log(err);
            }
        };

        const _registInstalledPlugins = () => {
            const installedPluginsFolder = pluginUtil.getInstalledPluginsFolder();
            const pluginsParentFolder = path.join(installedPluginsFolder, 'node_modules');
        
            if (!fs.existsSync(pluginsParentFolder)) {
                return;
            }

            fs.readdirSync(pluginsParentFolder).forEach(dirname => {
                if (/bio-plugin/.test(dirname)) {
                    _registOnePlugin(path.join(pluginsParentFolder, dirname));
                }
            });
        };

        const _registLinkedPlugins = () => {
            const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();
            
            if (!fs.existsSync(linkedPluginsFolder)) {
                return;
            }

            fs.readdirSync(linkedPluginsFolder).forEach(hashedName => {
                const hashedFolder = path.join(linkedPluginsFolder, hashedName);
                const subfiles = fs.readdirSync(hashedFolder);

                let pluginFolderName = '';

                subfiles.forEach(filename => {
                    if (pluginFolderName) {
                        return;
                    }
                    const folder = path.join(hashedFolder, filename);

                    if (fs.statSync(folder).isDirectory() && fs.existsSync(path.join(folder, 'index.js'))) {
                        pluginFolderName = filename;
                    }
                });

                if (pluginFolderName) {
                    _registOnePlugin(path.join(hashedFolder, pluginFolderName));
                }
            });
        };

        _registLinkedPlugins();
        _registInstalledPlugins(); // 安装的插件优先级更高，因为可能有命令重复的问题。
    },

    init: require('./libs/init'),
    add: require('./libs/add'),
    remove: require('./libs/remove'),
    list: require('./libs/list'),
    link: require('./libs/link'),
    unlink: require('./libs/unlink'),
};

