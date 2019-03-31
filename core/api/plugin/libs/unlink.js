const fs = require('fs');
const path = require('path');

const fse = require('fs-extra');
const md5 = require('md5');

const logUtil = require('../../../tool/log');
const pluginUtil = require('../util');

module.exports = () => {
    const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();
    const cwd = process.cwd();  
    const target = path.join(linkedPluginsFolder, md5(cwd));

    if (fs.existsSync(target)) {
        fse.removeSync(target);
    }

    logUtil.logGreen('unlinked!');
 };

