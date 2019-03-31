const path = require('path');

const pathUtil = require('../../tool/path');

module.exports = {
    getFullPluginName(pluginName) {
        if (pluginName.indexOf('qute-plugin-') === -1) {
            pluginName = `qute-plugin-${pluginName}`;
        }

        return pluginName;
    },
    getPluginsFolder() {
        return path.join(pathUtil.cacheFolder, 'plugins');
    },
    getInstalledPluginsFolder() {
        return path.join(this.getPluginsFolder(), 'installed');
    },
    getLinkedPluginsFolder() {
        return path.join(this.getPluginsFolder(), 'linked');
    },
};

