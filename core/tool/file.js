/**
 * @file
 * @desc file handlers
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const readdirEnhanced = require('readdir-enhanced').sync;

/**
 * @func
 * @desc read dir files
 * @param {String} dir: dir path
 * @param {String/RegExp} filter: situations of filtering files
 */
const readdirSync = (dir, filter) => {
    return readdirEnhanced(dir, {
        deep: filter || true,
        basePath: dir,
    });
};

module.exports = {

    readdirSync,

    /**
     * @func
     * @desc utime file
     * @param {String} filePath
     */
    utime(filePath) {
        const newTime = ((Date.now() - (10 * 1000))) / 1000;
        fs.utimesSync(filePath, newTime, newTime);
    },

    /**
     * @func
     * @desc copy file or dir and utime them
     * @param {String} from: src dir/file path
     * @param {String} to: target dir/file path
     */
    copySync(from, to) {
        fse.copySync(from, to);
        this.utime(to);
    },

    /**
     * @func
     * @desc write file
     * @param {String} filePath: file path
     * @param {String} content: file content for writing
     */
    writeFileSync(filePath, content) {
        const fd = fs.openSync(filePath, 'w+');
        fs.writeFileSync(filePath, content);
        fs.close(fd);
    },

    isEmptyDir({ dir, ignored } = {}) {
        const defaultIgnored = /(\.git)|(\.idea)|(\.ds_store)|(readme\.md)|(\.npm)/i;

        let isEmpty = true;

        fs.readdirSync(dir).forEach((filename) => {
            if (defaultIgnored.test(filename)) {
                return;
            }

            if (ignored) {
                const type = Object.prototype.toString.call(ignored);
                if (type === '[object RegExp]') {
                    if (ignored.test(filename)) {
                        return;
                    }
                } else if (type === '[object String]') {
                    if (ignored === filename) {
                        return;
                    }
                } else if (type === '[object Array]') {
                    for (let i = 0; i < ignored.length; i += 1) {
                        const itemType = Object.prototype.toString.call(ignored[i]);

                        if (itemType === '[object RegExp]') {
                            if (ignored[i].test(filename)) {
                                return;
                            }
                        } else if (itemType === '[object String]') {
                            if (ignored[i] === filename) {
                                return;
                            }
                        }
                    }
                }
            }

            isEmpty = false;
        });

        return isEmpty;
    },

    /**
     * @func
     * @desc rename some files
     * @param {String} dir: current project dir path
     */
    renameInvisableFiles(dir) {
        // rename files like gitignore/npmrc/npmignor to .gitignore/.npmrc/.npmignor
        const arr = fs.readdirSync(dir);
        arr.forEach((filename) => {
            if (/^((gitignore)|(npmrc)|(npmignore))$/.test(filename)) {
                const src = path.join(dir, filename);
                const target = path.join(dir, `.${filename}`);

                if (!fs.existsSync(target)) {
                    try {
                        fse.moveSync(src, target);
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        });
    },

};
