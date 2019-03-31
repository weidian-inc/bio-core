module.exports = ({ projectDir }) => {
    const fse = require('fs-extra');
    const fs = require('fs');
    const path = require('path');
    const readFileTree = require('directory-tree');

    const stringUtil = require('../../string-handlers');

    const ignoreUtil = require('../../ignore');

    const docDir = path.join(projectDir, 'docs');
    const sidebarFile = path.join(projectDir, '_sidebar.md');
    
    // 确认有 _sidebar.md
    fse.ensureFileSync(sidebarFile);

    const ab2link = (absolutePath) => {
        const relativePath = absolutePath.replace(projectDir, '');
        return relativePath;
        // return relativePath.replace(/\.md$/i, '');
    };

    const tree = readFileTree(docDir, {
        // exclude: ignoreUtil.sidebarshowignore,
        extensions: /\.md$/
    });

    const getTabBlank = (absolutePath) => {
        const relativePath = absolutePath.replace(docDir, '');
        const arr = relativePath.split('/');
        const count = arr.length;

        let blank = '';
        for (let i = 2; i < count; i++) {
            blank += '   ';
        }

        return blank;
    };

    const isBlankDir = (dirObj) => {
        let hasMdFiles = false;

        dirObj.children.forEach((item) => {
            const status = fs.statSync(item.path);
            if (status.isDirectory()) {
                hasMdFiles = true;
            } else if (status.isFile()) {
                if (/\.md/.test(item.extension)) {
                    hasMdFiles = true;
                }
            }
        });

        return !hasMdFiles;
    };

    const content = [];
    const insertContent = (tree) => {
        if (!tree) {
            return;
        }

        if (ignoreUtil.isIgnored(tree.path, ignoreUtil.sidebarshowignore)) {
            return;
        }

        // directory 的路径后面没有 / , 这里加上
        if (tree.type === 'directory' && !/\/$/.test(tree.path) && ignoreUtil.isIgnored(tree.path + '/', ignoreUtil.sidebarshowignore)) {
            return;
        }

        if (docDir !== tree.path) { // 排除 docDir 这个路径
            let blank = getTabBlank(tree.path);

            const filteredName = stringUtil.removeIndexString(tree.name.replace(/\.md$/, ''));

            if (tree.type === 'directory') {
                if (!isBlankDir(tree)) {
                    content.push(`${blank}+  **${filteredName}**`);
                }
            } else {
                content.push(`${blank}+  [${filteredName}](${ab2link(tree.path)})`);
            }
        }

        if (tree.children && tree.children.length) {
            tree.children.forEach((childTree) => {
                insertContent(childTree);
            });
        }
    };
    insertContent(tree);

    // 为 content 排序
    const sortContent = (content) => {
        const tempResult = [];

        const dispatch = (curAry) => {
            let curIndex = 0;

            curAry.forEach(item => {
                if (/^\+/.test(item)) {
                    if (!tempResult[curIndex]) {
                        tempResult[curIndex] = [];
                    }
                    tempResult[curIndex].push(item);
                    curIndex++;
                } else {
                    if (!tempResult[curIndex - 1]) {
                        tempResult[curIndex - 1] = [];
                    }
                    tempResult[curIndex - 1].push(item);
                }
            });

            tempResult.sort((a, b) => {
                return b.length - a.length;
            });
        };

        dispatch(content);

        // 生成 result
        const result = [];
        for (let i = 0, len = tempResult.length; i < len; i++) {
            const item = tempResult[i];
            const itemLength = item.length;

            for (let j = 0; j < itemLength; j++) {
                result.push(item[j]);
            }
        }

        return result;
    };

    const sortedContent = sortContent(content);

    fs.writeFileSync(sidebarFile, sortedContent.join('\n'));
};