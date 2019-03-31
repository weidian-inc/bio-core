const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const syncDirectory = require('sync-directory');

const fileUtil = require('../../../tool/file');
const ignoreUtil = require('./ignore');
const stringUtil = require('./string-handlers');

module.exports = {
    init({ wrapperDir, rootDir, cacheProjectDir, showIndex, env, useUserSidebar, useUserNavbar }) {
        Object.assign(this, { wrapperDir, rootDir, cacheProjectDir, showIndex, env, useUserSidebar, useUserNavbar });
    },

    _generateWrapperDependencies() {
        // 将模板中的 package.json 复制到 wrapper 目录，便于安装依赖
        ['package.json', 'package-lock.json'].forEach((name) => {
            const src = path.join(__dirname, `./template/project/${name}`);
            if (fs.existsSync(src)) {
                fse.copySync(src, path.join(this.wrapperDir, name));
            }
        });

        // 为 wrapper 目录执行 npm install
        const nmDir = path.join(this.wrapperDir, 'node_modules');
        if (!fs.existsSync(nmDir) || fs.readdirSync(nmDir).length < 3) {
            require('child_process').execSync(`cd ${this.wrapperDir} && npm i`);
        }
    },

    _commonPreHandler() {
        // 为 wrapper 目录生成依赖，主要是 docsify-cli
        this._generateWrapperDependencies();

        // 在 wrapper 中创建单个 project，基于当前项目目录
        this._createProject();
    },

    _commonAfterHandler() {
        
    },

    _getFixPageTitleString() {
        return `
            var fixPageTitleTextTimer = null;
            var fixPageTitleBug = function() {
                var startTime = new Date().getTime();
                var endTime = startTime + 3000;
                clearInterval(fixPageTitleTextTimer);
                fixPageTitleTextTimer = setInterval(function() {
                    var title = document.title;
                    if (/\\-$/.test(title)) {
                        document.title = title.replace(/\\-$/, '');
                    }
                    if (new Date().getTime() >= endTime) {
                        clearInterval(fixPageTitleTextTimer);
                    }
                }, 100);
            };
        `;
    },

    handleMultiProject() {
        this._commonPreHandler();

        // 读取当前项目的目录
        const dirnames = fs.readdirSync(this.rootDir).filter(filename => {
            const isDirectory = fs.statSync(path.join(this.rootDir, filename)).isDirectory();
            return isDirectory && !ignoreUtil.isIgnored(filename, ignoreUtil.navbarignore);
        });

        // 为每个目录新增 README.md，如果不存在的话
        fs.readdirSync(path.join(this.cacheProjectDir, 'docs')).forEach((dirname) => {
            const dirpath = path.join(this.cacheProjectDir, 'docs', dirname);

            if (fs.statSync(dirpath).isDirectory()) {
                const readme = path.join(dirpath, 'README.md');
                if (!fs.existsSync(readme)) {
                    fse.ensureFileSync(readme);
                    fileUtil.writeFileSync(readme, 'Click Sidebar Please...');
                }
            }
        });

        // used for write navbar
        // 生成 navbar 上的各个链接
        const getAllSitesInNavbar = () => {
            // init with homepage
            const allSitesInNavbar = [{
                hash: `#/`,
                encodedHash: `#/`,
                name: 'Homepage' // path.basename(this.rootDir)
            }];
            dirnames.forEach((dirname) => {
                allSitesInNavbar.push({
                    hash: `#/docs/${dirname}/`,
                    encodedHash: `#/docs/${encodeURIComponent(dirname)}/`,
                    name: stringUtil.removeIndexString(dirname)
                });
            });

            return allSitesInNavbar;
        };

        const rewriteNavbarInHtml = (indexHtmlContent) => {
            // get all navebar sites
            const allSitesInNavbar = getAllSitesInNavbar();

            var linkArr = [];

            allSitesInNavbar.forEach(obj => {
                linkArr.push(`<a href="${obj.hash}">${obj.name}</a>`);
            });

            return indexHtmlContent.replace('<body>', `
                    <body>
                    <nav>
                        ${linkArr.join('')}
                    </nav>
                `);
        };

        const addScriptInHtml = (indexHtmlContent) => {
            indexHtmlContent = indexHtmlContent.replace('<script src="./assets/page-config.js"></script>', `
                    <script src="./assets/page-config.js"></script>
                    <script>
                    (function() {    
                        // 标准化 hash，默认返回 '#/'
                        var getHash = function() {
                            var hash = window.location.hash;
                            if (!hash || hash === '#' || hash === '#/') {
                                return '#/'; // 默认
                            } else {
                                return window.location.hash.split('?')[0];
                            }
                        };

                        var allSitesInNavbar = ${JSON.stringify(getAllSitesInNavbar(), null, '\t')};
                        var urlMap = {};
                        allSitesInNavbar.forEach(function(item, index) {
                            // 由于子目录标题是根据 hash 拦截字符串获取的，必须过滤掉跟路径，这个 '#/' 是人为定义的
                            if (item.hash === '#/') {
                                return;
                            }
                            
                            urlMap[item.hash] = urlMap[item.encodedHash] = {
                                index: index,
                                name: ${this.showIndex ? 'item.name' : 'item.name.replace(/^\\d*-/, "")'}
                            };
                        });

                        ${this._getFixPageTitleString()};

                        // 该函数在页面进入和 hash change 的时候触发
                        var whenHashChange = function() {
                            var hash = getHash();

                            // 如果跳转的是根目录，单独做处理，否则按照子目录处理
                            if (hash === '#/') {
                                var rootName = 'Homepage'; // '${path.basename(this.rootDir)}';
                                window.$docsify.name =  '${path.basename(this.rootDir)}';
                                window.$docsify.loadSidebar = false; // 根目录不需要展示 sidebar
                                document.title = rootName;

                                // 重写页面名称
                                window.$docsify.name = rootName;

                                // 覆盖 sidebar 部分的名称
                                $('.app-name-link').text(rootName);
                            } else {
                                var info = urlMap[hash];
                                var matchedInfo = null;

                                for (var key in urlMap) {
                                    if (hash.indexOf(key) !== -1) {
                                        matchedInfo = urlMap[key];
                                        break;
                                    }
                                }

                                if (matchedInfo) {
                                    // 生成 sidebar 链接。去掉 '^#/' 和 '^/'
                                    var hashStr = getHash().replace(/^#\\//, '').replace(/^\\//, '');
                                    var length = 0;
                                    if (!/\\/$/.test(hashStr)) {
                                        length = hashStr.replace(/\\/$/, '').split('/').length${this.env === 'github' ? ' - 1' : ''};
                                    } else {
                                        length = hashStr.replace(/\\/$/, '').split('/').length;
                                    }

                                    var deepLevelStr = '';
                                    for (var i = 0; i < length; i++) {
                                        deepLevelStr += '../';
                                    }

                                    window.$docsify.loadSidebar = deepLevelStr + 'sidebars/' + matchedInfo.index + '.md';
                                    
                                    // 重写页面名称
                                    window.$docsify.name = matchedInfo.name;

                                    // 覆盖 sidebar 部分的名称
                                    $('.app-name-link').text(decodeURIComponent(matchedInfo.name));
                                }
                            }

                            // 解决 title 中出现 - 结尾的显示问题
                            fixPageTitleBug();
                        };
                        window.addEventListener('hashchange', whenHashChange);

                        whenHashChange();

                        $(document).delegate('.app-name-link', 'click', function(e) {
                            var hash = getHash();
                            if (hash === '#/') {
                                return;
                            }
                            e.preventDefault();

                            var subname = hash.replace('#/docs/', '').split('/')[0];
                            var preHref = window.location.href.split('/#')[0];
                            var href = preHref + '/#/docs/' + subname + '/';
                            window.location.href = href;
                        });

                        // use loadNavbar by html not _navbar.md
                        window.$docsify.loadNavbar = false;

                        ${fs.existsSync(path.join(this.rootDir, '.repo')) ? 'window.$docsify.repo = "' + fs.readFileSync(path.join(this.rootDir, '.repo'), 'utf8') + '";' : ''}
                    })();
                    </script>
                `);

            return indexHtmlContent;
        };

        // rewrite sidebar
        // 生成多个 sidebar 到 ./sidebars/ 目录
        const rewriteSidebars = () => {
            // ensure homepage's sidebar file exists first and no content
            fse.ensureFileSync(path.join(this.cacheProjectDir, `sidebars/0.md`));

            dirnames.forEach((dirname, index) => {
                const targetSidebar = path.join(this.cacheProjectDir, `sidebars/${index +  1}.md`);
                fse.ensureFileSync(targetSidebar);

                // 写入 content, 以最终项目目录的 docs 为准
                const content = this._generateMenuByDir(path.join(this.cacheProjectDir, 'docs', dirname));
                fileUtil.writeFileSync(targetSidebar, content);
            });
        };

        rewriteSidebars();

        // write urlMap into index.html
        const indexHtml = path.join(this.cacheProjectDir, 'index.html');
        let indexHtmlContent = fs.readFileSync(indexHtml, 'utf8');

        indexHtmlContent = rewriteNavbarInHtml(indexHtmlContent);

        indexHtmlContent = addScriptInHtml(indexHtmlContent);

        // write html
        fileUtil.writeFileSync(indexHtml, indexHtmlContent);

        this._commonAfterHandler();
    },

    _createProject() {
        // create project dir

        // 清空原来的项目目录
        fse.removeSync(this.cacheProjectDir);
        fse.ensureDirSync(this.cacheProjectDir);

        // 复制项目模板
        fse.copySync(path.join(__dirname, './template/project'), this.cacheProjectDir);

        // 锁定 docs 目录
        const docsFolder = path.join(this.cacheProjectDir, 'docs');

        // 将非 .md 的文件，转为 .md 文件
        const transformFileToMdFile = (type, filepath) => {
            const extname = path.extname(filepath);

            if (/\.md/.test(extname)) {
                return;
            }

            const dirname = path.dirname(filepath);
            const filename = filepath.split(path.sep).pop().replace(/^\./, '');
            // const newFilePath = `${filepath.replace(/^\./, '')}.md`;
            const newFilePath = `${path.join(dirname, filename)}.md`

            if (/(add)|(change)/.test(type)) {
                fse.ensureFileSync(newFilePath);

                const content = `
\`\`\`${extname.replace('.', '')}
${fs.readFileSync(filepath, 'utf-8')}
\`\`\`
`;

                fs.writeFileSync(newFilePath, content);
            } else if (/unlink/.test(type)) {
                if (fs.existsSync(newFilePath)) {
                    fse.removeSync(newFilePath);
                }
            }
        };

        const transformAllToMdFile = (docsDir) => {
            require('recursive-readdir-sync')(docsDir).forEach(filepath => {
                transformFileToMdFile('add', filepath);
            });
        };

        // 复制项目所有文件到 docs 目录
        syncDirectory(this.rootDir, docsFolder, {
            type: this.env === 'github' ? 'copy' : 'hardlink',
            watch: this.env === 'github' ? false : true,
            exclude: ignoreUtil.sidebarfileignore,
            filter: filepath => fs.statSync(filepath).size <= 20971520, // 1024 * 1024 * 20
            cb: ({ type, path }) => {
                const cwd = process.cwd();
                const relativePath = path.replace(cwd, '');
                const _path = require('path');
                const targetPath = _path.join(docsFolder, relativePath);
                
                // 如果文件是 .md 文件结尾的 && 存在 && 内容为空，则添加 todo... 内容
                if (/\.md$/.test(relativePath) && fs.existsSync(targetPath) && !fs.readFileSync(targetPath, 'utf8').replace(/\s|\n/g, '')) {
                    fse.removeSync(targetPath);
                    fse.ensureFileSync(targetPath);
                    fileUtil.writeFileSync(targetPath, 'todo...');
                }

                // 将 docs 中非 .md 的文件，转为 .md 文件
                transformFileToMdFile(type, targetPath);
            }
        });

        transformAllToMdFile(docsFolder);

        // 复制几个特殊文件到 ../docs，也就是项目的根目录
        const importantFiles = ['README.md', '.sidebarshowignore', '.gitignore'];

        if (this.env === 'github') {
            importantFiles.push('.git');
        }

        if (this.useUserSidebar) {
            importantFiles.push('_sidebar.md');
        }

        if (this.useUserNavbar) {
            importantFiles.push('_navbar.md');
        }

        importantFiles.forEach(file => {
            if (fs.existsSync(path.join(this.rootDir, file))) {
                fse.copySync(path.join(this.rootDir, file), path.join(this.cacheProjectDir, file));
            }
        });
    },

    _generateMenuByDir(dir) {
        const fs = require('fs');
        const readFileTree = require('directory-tree');

        const ab2link = (absolutePath) => {
            const relativePath = absolutePath.replace(this.cacheProjectDir, '');
            return relativePath.replace(/\.md$/i, '');
        };

        const tree = readFileTree(dir, {
            // exclude: ignoreUtil.sidebarshowignore,
            extensions: /\.md$/
        });

        const getTabBlank = (absolutePath) => {
            const relativePath = absolutePath.replace(dir, '');
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

            
            if (dir !== tree.path) { // 排除 dir 这个路径
                let blank = getTabBlank(tree.path);

                if (tree.type === 'directory') {
                    if (!isBlankDir(tree)) {
                        content.push(`${blank}+  **${tree.name.replace(/\.md$/, '')}**`);
                    }
                } else {
                    content.push(`${blank}+  [${tree.name.replace(/\.md$/, '')}](${ab2link(tree.path)})`);
                }
            }

            if (tree.children && tree.children.length) {
                tree.children.forEach((childTree) => {
                    insertContent(childTree);
                });
            }
        };
        insertContent(tree);

        return content.join('\n');
    },

    handleLocalProject() {
        this._commonPreHandler();

        // rewrite index.html
        const indexHtml = path.join(this.cacheProjectDir, 'index.html');
        let indexHtmlContent = fs.readFileSync(indexHtml, 'utf8');

        const pagename = stringUtil.removeIndexString(path.basename(this.rootDir));

        const repoFile = path.join(this.rootDir, '.repo');
        indexHtmlContent = indexHtmlContent.replace('</body>', `
            <script>
                (function() {
                    window.$docsify.name = '${pagename}';
                    window.$docsify.loadNavbar = ${this.useUserNavbar};
                    document.title = '${pagename}';
                    ${fs.existsSync(repoFile) ? 'window.$docsify.repo = "' + fs.readFileSync(repoFile, 'utf8') + '";' : ''}

                    ${this._getFixPageTitleString()};

                    var whenHashChange = function() {
                        fixPageTitleBug();
                    };

                    window.addEventListener('hashchange', whenHashChange);

                    whenHashChange();
                })();
                
            </script>
            </body>
        `);

        // write html
        fileUtil.writeFileSync(indexHtml, indexHtmlContent);

        this._commonAfterHandler();
    },
};