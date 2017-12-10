const co = require('co');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const md5 = require('md5');

const { expect } = require('chai');
const pathUtil = require('../../core/tool/path');

const cacheFolder = path.join(process.env.HOME, '.bio');

describe('test bio-cmd/tool/path.js functions', () => {
    const { getScaffoldWrapper, getScaffoldExecInstallFolder, getScaffoldFolder, getWorkspaceFolder } = pathUtil;

    it('test getScaffoldWrapper', () => {
        expect(getScaffoldWrapper.call(pathUtil)).to.be.equal(path.join(cacheFolder, 'scaffold'));
    });

    it('test getScaffoldExecInstallFolder', () => {
        expect(getScaffoldExecInstallFolder.call(pathUtil, 'vue')).to.be.equal(path.join(cacheFolder, 'scaffold', `install-cache-${md5('vue')}`));
    });

    it('test getScaffoldFolder', () => {
        expect(getScaffoldFolder.call(pathUtil, 'vue')).to.be.equal(path.join(cacheFolder, 'scaffold/vue'));
    });

    it('test getWorkspaceFolder', () => {
        expect(getWorkspaceFolder.call(pathUtil, { cwd: __dirname, scaffoldName: 'vue' })).to.be.equal(path.join(cacheFolder, 'scaffold/vue/workspace', md5(__dirname), path.basename(__dirname)));
    });
});
