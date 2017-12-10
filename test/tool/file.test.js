const fse = require('fs-extra');
const path = require('path');
const fs = require('fs');

const { expect } = require('chai');
const fileUtil = require('../../core/tool/file');

describe('test core/tool/file.js readdirSync', () => {
    const { readdirSync } = fileUtil;

    const testDirname = 'test-file-function-readdirSync';
    const testDirPath = path.join(__dirname, testDirname);

    beforeEach(() => {
        fse.ensureDirSync(testDirPath);
    });

    afterEach(() => {
        if (fs.existsSync(testDirPath)) {
            fse.removeSync(testDirPath);
        }
    });

    it('when dir is fully empty', () => {
        expect(readdirSync(testDirPath)).to.be.deep.equal([]);
    });

    it('when dir has some files', () => {
        fse.ensureFileSync(path.join(testDirPath, 'a.js'));
        fse.ensureFileSync(path.join(testDirPath, 'b.js'));
        fse.ensureFileSync(path.join(testDirPath, 'c.js'));

        const files = readdirSync(testDirPath);
        const map = {};

        files.forEach((element) => {
            map[element.replace(testDirPath, '').replace(/^\//, '')] = true;
        });

        expect(map).to.be.deep.equal({
            'a.js': true,
            'b.js': true,
            'c.js': true,
        });
    });
});

describe('test core/tool/file.js utime', () => {
    const { utime } = fileUtil;

    const testFile = path.join(__dirname, 'test-file-function-utime');

    let fd;
    let oldAtime;
    let oldMtime;
    beforeEach(() => {
        fd = fs.openSync(testFile, 'w+');
        fs.writeFileSync(testFile, 'xxx');
        fs.closeSync(fd);

        const stats = fs.statSync(testFile);
        oldAtime = stats.atimeMs;
        oldMtime = stats.mtimeMs;
    });

    afterEach(() => {
        if (fs.existsSync(testFile)) {
            fse.removeSync(testFile);
        }
    });

    it('when file is utimed', () => {
        utime(testFile);
        const stats = fs.statSync(testFile);
        const newAtime = stats.atimeMs;
        const newMtime = stats.mtimeMs;
        expect(newAtime).to.be.not.equal(oldAtime);
        expect(newMtime).to.be.not.equal(oldMtime);
    });
});

describe('test core/tool/file.js writeFileSync', () => {
    const { writeFileSync } = fileUtil;

    const testFileName = 'test-file-function-writeFileSync';
    const testFile = path.join(__dirname, testFileName);
    beforeEach(() => {
        if (fs.existsSync(testFile)) {
            fse.removeSync(testFile);
        }
    });

    afterEach(() => {
        if (fs.existsSync(testFile)) {
            fse.removeSync(testFile);
        }
    });

    it('when writing file', () => {
        writeFileSync(testFile);
        expect(fs.readdirSync(__dirname).indexOf(testFileName)).to.be.not.equal(-1);
    });
});

describe('test core/tool/file.js copySync', () => {
    const { copySync } = fileUtil;

    const testSrcFileName = 'test-file-function-copySync-src';
    const testTargetFileName = 'test-file-function-copySync-target';
    const testSrcFile = path.join(__dirname, testSrcFileName);
    const testTargetFile = path.join(__dirname, testTargetFileName);
    beforeEach(() => {
        fd = fs.openSync(testSrcFile, 'w+');
        fs.writeFileSync(testSrcFile, 'xxx');
        fs.closeSync(fd);
    });

    afterEach(() => {
        if (fs.existsSync(testSrcFile)) {
            fse.removeSync(testSrcFile);
        }
        if (fs.existsSync(testTargetFile)) {
            fse.removeSync(testTargetFile);
        }
    });

    it('when copying', () => {
        copySync.call(fileUtil, testSrcFile, testTargetFile);
        expect(fs.readdirSync(__dirname).indexOf(testTargetFileName)).to.be.not.equal(-1);
    });
});

describe('test core/tool/file.js isEmptyDir', () => {
    const { isEmptyDir } = fileUtil;

    const testDirname = 'test-file-function-isEmptyDir';
    const testDirPath = path.join(__dirname, testDirname);

    const createFiles = (fileList) => {
        fse.ensureDirSync(testDirPath);
        fileList.forEach((filename) => {
            const filePath = path.join(testDirPath, filename);
            const fd = fs.openSync(filePath, 'w+');
            fs.writeFileSync(filePath, 'xxx');
            fs.closeSync(fd);
        });
    };

    beforeEach(() => {
        fse.ensureDirSync(testDirPath);
    });

    afterEach(() => {
        if (fs.existsSync(testDirPath)) {
            fse.removeSync(testDirPath);
        }
    });

    it('when testing isEmptyDir: all default files', () => {
        const fileList = ['readme.md', '.git', '.gitignore', '.npmignore', '.idea', '.ds_store'];
        createFiles(fileList);

        expect(isEmptyDir.call(fileUtil, { dir: testDirPath })).to.be.equal(true);
    });

    it('when testing isEmptyDir: without ignored and no default files', () => {
        const fileList = ['test.js'];
        createFiles(fileList);

        expect(isEmptyDir.call(fileUtil, { dir: testDirPath })).to.be.equal(false);
    });

    it('when testing isEmptyDir: ignored', () => {
        const fileList = ['test.js', 'cc.txt'];
        createFiles(fileList);

        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: /test\.js/ })).to.be.equal(false);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: 'test.js' })).to.be.equal(false);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: [/test\.js/] })).to.be.equal(false);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: ['test.js'] })).to.be.equal(false);

        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: /(test\.js)|(cc\.txt)/ })).to.be.equal(true);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: [/test\.js/, /cc\.txt/] })).to.be.equal(true);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: ['test.js', 'cc.txt'] })).to.be.equal(true);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: [/test\.js/, 'cc.txt'] })).to.be.equal(true);
        expect(isEmptyDir.call(fileUtil, { dir: testDirPath, ignored: ['test.js', /cc\.txt/] })).to.be.equal(true);
    });
});

describe('test core/tool/file.js renameInvisableFiles', () => {
    const { renameInvisableFiles } = fileUtil;

    const testDirname = 'test-file-function-renameInvisableFiles';
    const testDirPath = path.join(__dirname, testDirname);

    const createFiles = (fileList) => {
        fse.ensureDirSync(testDirPath);
        fileList.forEach((filename) => {
            const filePath = path.join(testDirPath, filename);
            const fd = fs.openSync(filePath, 'w+');
            fs.writeFileSync(filePath, 'xxx');
            fs.closeSync(fd);
        });
    };

    afterEach(() => {
        if (fs.existsSync(testDirPath)) {
            fse.removeSync(testDirPath);
        }
    });

    it('when renameInvisableFiles', () => {
        createFiles(['npmignore', 'gitignore', 'npmrc', 'n2pmrc']);
        renameInvisableFiles.call(fileUtil, testDirPath);

        const newFiles = fs.readdirSync(testDirPath);

        expect(newFiles.indexOf('npmignore')).to.be.equal(-1);
        expect(newFiles.indexOf('gitignore')).to.be.equal(-1);
        expect(newFiles.indexOf('npmrc')).to.be.equal(-1);
        expect(newFiles.indexOf('.n2pmrc')).to.be.equal(-1);

        expect(newFiles.indexOf('n2pmrc')).to.be.not.equal(-1);
        expect(newFiles.indexOf('.npmignore')).to.be.not.equal(-1);
        expect(newFiles.indexOf('.gitignore')).to.be.not.equal(-1);
        expect(newFiles.indexOf('.npmrc')).to.be.not.equal(-1);
    });
});
