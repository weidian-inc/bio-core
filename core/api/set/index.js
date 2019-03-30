/**
 * @file
 * @desc set configs
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const pathUtil = require('../../tool/path');
const npmUtil = require('../../tool/npm');
const scaffoldUtil = require('../../tool/scaffold');

const checkType = (input, expectedType) => {
    if (!Object.prototype.toString.call(input) === expectedType) {
        throw Error(`[bio-core set] config "${input}" should be an Object but received ${Object.prototype.toString.call(input)}`);
    }
};

/**
 * @func
 * @desc set configs
 * @param {Object}
 * @param {String} object.cacheFolder: path for storing modules like cmd/scaffold. 'path.join(process.env.HOME, '.bio')' by default
 * @param {String} object.registry: registry used by installing and updating scaffold. user config by default
 */
module.exports = ({ cacheFolder, registry, scaffoldList, beforeScaffoldInstall } = {}) => {
    if (cacheFolder) {
        checkType(cacheFolder, '[object String]');
        pathUtil.cacheFolder = cacheFolder;
    }

    if (registry) {
        npmUtil.registry = registry;
    }

    if (beforeScaffoldInstall) {
        scaffoldUtil.beforeScaffoldInstall = beforeScaffoldInstall.bind(scaffoldUtil);
    }

    if (scaffoldList && scaffoldList.length) {
        const formattedScaffoldList = [];

        // TODO: check

        // format
        scaffoldList.forEach((item, index) => {
            const formattedItem = {};

            formattedItem.name = `${item.shortName} : ${item.desc}`;
            formattedItem.value = item.shortName;
            formattedItem.fullName = item.fullName;
            formattedItem.version = item.version || 'latest';

            formattedScaffoldList[index] = formattedItem;
        });

        scaffoldUtil.scaffoldList = formattedScaffoldList;
    }
};
