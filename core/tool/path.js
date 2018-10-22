/**
 * @file
 * @desc path handers
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const path = require('path');
const md5 = require('md5');

module.exports = {

    // config file of current project
    configName: '.biorc',

    // cache path for storing modules like cmd/scaffold
    cacheFolder: path.join(process.env.HOME, '.bio'),

    /**
     * @func
     * @desc get dir path of scaffold wrapper
     * @param {String} scaffoldName
     * @return {String} scaffold wrapper path
     */
    getScaffoldWrapper() {
        return path.join(this.cacheFolder, 'scaffold');
    },

    /**
     * @func
     * @desc get dir path for execing installing scaffold
     * @param {String} scaffoldName
     * @return {String} dir path for execing installing scaffold
     */
    getScaffoldInstallFolder(scaffoldName) {
        return path.join(this.getScaffoldWrapper(scaffoldName), `install-scaffold/${md5(scaffoldName)}`);
    },

    /**
     * @func
     * @desc get scaffold dir path
     * @param {String} scaffoldName
     * @return {String} scaffold dir path
     */
    getScaffoldFolder(scaffoldName) {
        return path.join(this.getScaffoldWrapper(scaffoldName), scaffoldName);
    },

    /**
     * @func
     * @desc get workspace dir path
     * @param {Object}
     * @param {String} object.cwd: current project path
     * @param {String} object.scaffoldName
     * @return {String} workspace dir path
     */
    getWorkspaceFolder({ cwd, scaffoldName }) {
        const currentDirname = cwd.replace(path.dirname(cwd), '').replace(/^\//, '').replace(/\/$/, '');
        const scaffoldFolder = this.getScaffoldFolder(scaffoldName);
        const workspaceFolder = path.join(scaffoldFolder, 'workspace', md5(cwd), currentDirname);
        return workspaceFolder;
    },

};
