/**
 * @file
 * @desc path handers
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const path = require('path');


module.exports = {
    // cache path for storing modules like cmd/scaffold
    cacheFolder: path.join(process.env.HOME, '.bio'),
};
