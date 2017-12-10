/**
 * @file
 * @desc npm handlers
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

const registryUrl = require('registry-url');

module.exports = {
    // user registry by default
    scaffoldRegistry: registryUrl(),
};
