const fs = require('fs');
const path = require('path');

const fse = require('fs-extra');
const md5 = require('md5');

const logUtil = require('../../../tool/log');
const pluginUtil = require('../util');

module.exports = () => {
    const linkedPluginsFolder = pluginUtil.getLinkedPluginsFolder();
    const cwd = process.cwd();  
    const dirname = cwd.split(path.sep).pop();
    const target = path.join(linkedPluginsFolder, md5(cwd), dirname);

    if (fs.existsSync(target)) {
        fse.removeSync(target);
    }

    fse.ensureSymlinkSync(cwd, target);
    logUtil.logGreen('linked as a bio plugin!');
 };

