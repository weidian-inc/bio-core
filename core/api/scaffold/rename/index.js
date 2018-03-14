/**
 * @file
 * @desc rename scaffold
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const fileUtil = require('../../../tool/file');
const pathUtil = require('../../../tool/path');
const scaffoldUtil = require('../../../tool/scaffold');

/**
 * @func
 * @desc rename scaffold
 * @param {String} oldName scaffold name
 * @param {String} newName scaffold name
 */
module.exports = (oldName, newName) => {
    const fullOldName = scaffoldUtil.getFullName(oldName);
    const fullNewName = scaffoldUtil.getFullName(newName);

    const oldPath = pathUtil.getScaffoldFolder(fullOldName);
    const newPath = pathUtil.getScaffoldFolder(fullNewName);

    // rename
    fse.moveSync(oldPath, newPath);

    // rewrite package.json
    const formattedPkgObj = {};
    const newPkgPath = path.join(newPath, 'package.json');
    const newPkgObj = JSON.parse(fs.readFileSync(newPkgPath).toString());

    Object.keys(newPkgObj).forEach((key) => {
        if (/^(description)|(dependencies)|(devDpendencies)|(license)|(main)|(name)|(version)$/.test(key)) {
            if (key === 'version') {
                formattedPkgObj.version = '1.0.0';
            } else if (key === 'name') {
                formattedPkgObj.name = newName;
            } else {
                formattedPkgObj[key] = newPkgObj[key];
            }
        }
    });

    fileUtil.writeFileSync(newPkgPath, JSON.stringify(formattedPkgObj, null, 4));
};
