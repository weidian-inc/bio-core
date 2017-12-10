const co = require('co');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const { expect } = require('chai');
const scaffoldUtil = require('../../core/tool/scaffold');

// pre set
scaffoldUtil.scaffoldList = [{
    name: 'vue',
    value: 'vue',
    fullName: 'vue-full-name',
}, {
    name: 'react',
    value: 'react',
    fullName: 'react-full-name',
}];

const createConfigFile = (dirName, content) => {
    const testDirPath = path.join(__dirname, dirName);
    const configFilePath = path.join(testDirPath, '.biorc');

    fse.ensureDirSync(testDirPath);

    const fd = fs.openSync(configFilePath, 'w+');
    fs.writeFileSync(configFilePath, content);
    fs.closeSync(fd);
};

describe('test bio-cmd/tool/scaffold.js function getFullName and getShortName', () => {
    const { getFullName, getShortName } = scaffoldUtil;

    it('test get full name', () => {
        expect(getFullName.call(scaffoldUtil, 'vue')).to.be.equal('vue-full-name');
        expect(getFullName.call(scaffoldUtil, 'vue-full-name')).to.be.equal('vue-full-name');
    });

    it('test get short name', () => {
        expect(getShortName.call(scaffoldUtil, 'vue-full-name')).to.be.equal('vue');
    });
});

describe('test bio-cmd/tool/scaffold.js function getScaffoldName', () => {
    const { getScaffoldName } = scaffoldUtil;
    const testDirName = 'test-scaffold-function-getScaffoldName-dir';
    const testDirPath = path.join(__dirname, testDirName);

    beforeEach(() => {
        createConfigFile(testDirName, JSON.stringify({
            scaffold: 'vue',
        }));
    });

    afterEach(() => {
        if (fs.existsSync(testDirPath)) {
            fse.removeSync(testDirPath);
        }
    });

    it('test getScaffoldName', () => {
        expect(getScaffoldName.call(scaffoldUtil, testDirPath)).to.be.equal('vue');
    });
});

describe('test bio-cmd/tool/scaffold.js function isScaffoldExists', () => {
    const { isScaffoldExists } = scaffoldUtil;

    it('test isScaffoldExists', () => {
        expect(isScaffoldExists.call(scaffoldUtil, 'dsafdsafd')).to.be.equal(false);
    });
});
