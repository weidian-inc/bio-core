/**
 * @file
 * @desc show scaffold
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const scaffoldUtil = require('../../../tool/scaffold');

/**
 * @func
 * @desc show scaffold
 * @param {String} scaffoldName scaffold name ( full name )
 */
module.exports = (scaffoldName = '') => {
    if (!scaffoldName) {
        throw Error('bio-core: please pass in scaffold name');
    }

    const fullScaffoldName = scaffoldUtil.getFullName(scaffoldName);

    const scaffoldFolder = scaffoldUtil.getScaffoldFolder(fullScaffoldName);

    // 判断脚手架是否已安装
    if (scaffoldUtil.isScaffoldExists(fullScaffoldName)) {
        console.log(`\n\nScaffold path: ${scaffoldFolder}\n\n`.green);
        require('child_process').execSync(`cd ${scaffoldFolder} && open .`);
    } else {
        console.log(`Scaffold ${scaffoldFolder} does not exist at local.`.red);
    }
};
