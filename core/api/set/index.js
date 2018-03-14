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
 * @param {String} object.configName: config file of current project. '.biorc' by default
 * @param {String} object.scaffoldRegistry: registry used by installing and updating scaffold. user config by default
 */
module.exports = ({ cacheFolder, configName, scaffold } = {}) => {
    if (cacheFolder) {
        checkType(cacheFolder, '[object String]');
        pathUtil.cacheFolder = cacheFolder;
    }

    if (configName) {
        checkType(configName, '[object String]');
        pathUtil.configName = configName;
    }

    if (scaffold) {
        checkType(configName, '[object Object]');

        if (scaffold.registry) {
            npmUtil.scaffoldRegistry = scaffold.registry;
        }

        if (scaffold.preInstall) {
            scaffoldUtil.preInstall = scaffold.preInstall.bind(scaffoldUtil);
        }

        if (scaffold.list && scaffold.list.length) {
            const formattedScaffoldList = [];

            // TODO: check

            // format
            scaffold.list.forEach((item, index) => {
                const formattedItem = {};

                formattedItem.name = `${item.shortName} : ${item.desc}`;
                formattedItem.value = item.shortName;
                formattedItem.fullName = item.fullName;
                formattedItem.version = item.version || 'latest';

                formattedScaffoldList[index] = formattedItem;
            });

            scaffoldUtil.scaffoldList = formattedScaffoldList;
        }
    }
};
