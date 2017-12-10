/**
 * @file
 * @desc install scaffold
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

const scaffoldUtil = require('../../../tool/scaffold');

/**
 * @func
* @desc install scaffold
* @param {String} scaffoldName scaffold name ( full name )
*/
module.exports = (scaffoldName = '') => {
    if (scaffoldName === '') {
        throw Error('bio-core: please pass in scaffold name');
    }

    const fullScaffoldName = scaffoldUtil.getFullName(scaffoldName);

    console.log(`installing scaffold ${fullScaffoldName}...`);
    scaffoldUtil.installScaffold(fullScaffoldName);
};
