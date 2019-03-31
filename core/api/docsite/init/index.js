/**
 * @file
 * @desc init project
 * @author https://github.com/hoperyy
 * @date  2018/05/26
 */

// const fs = require('fs');
const path = require('path');
const fileUtil = require('../../../tool/file');
const fse = require('fs-extra');

/**
 * @func
 * @desc init project
 * @param {Object}
 * @param {String/RegExp/Array} object.ignored will be used when testing if dir is empty. 'null' by default
 * @param {String} object.scaffoldName: scaffold name(full name)
 */
module.exports = ({ ignored = [/readme\.md/i] } = {}) => {
    const cwd = process.cwd();

    if (fileUtil.isEmptyDir({ dir: cwd, ignored })) {
        fse.copySync(path.join(__dirname, '../_tool/template/doc'), cwd);
    } else {
        console.log('\nSkip creating doc files because there are files exisiting in current directory.'.yellow);
    }

    console.log('\nInit docs successfully!\n');
};
