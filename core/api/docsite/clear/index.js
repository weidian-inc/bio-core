/**
 * @file
 * @desc init project
 * @author https://github.com/hoperyy
 * @date  2018/05/26
 */

const fs = require('fs');
const fse = require('fs-extra');
const projectCacheDir = require('../_tool/config').projectCacheDir;

module.exports = () => {
    if (fs.existsSync(projectCacheDir)) {
        try {
            fse.removeSync(projectCacheDir);
        } catch(e) {
            console.log('clear failed: ', e);
        }
    }

    console.log('clear done!');
    
};
