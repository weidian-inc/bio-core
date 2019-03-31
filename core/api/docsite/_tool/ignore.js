const fs = require('fs');
const path = require('path');

module.exports = {
    init(currentDir) {
        if (this.sidebarshowignore && this.navbarignore) {
            return {
                sidebarshowignore: this.sidebarshowignore,
                sidebarfileignore: this.sidebarfileignore,
                navbarignore: this.navbarignore,
            };
        }

        const commonIgnoreReg = /(DS_Store)|(node_modules)|(bower_components)|(\/_iframe)|(\.git)/i;

        // files that should not be shown in sidebar; but can be found in 'docs'
        this.sidebarshowignore = [commonIgnoreReg, /(_sidebar\.md)|(_navbar\.md)|(\.repo)|(\.sidebarshowignore)|(\.navbarignore)|(\.gitignore)/i];

        // files that should not be found in 'docs';
        this.sidebarfileignore = [commonIgnoreReg, /(_sidebar\.md)|(_navbar\.md)|(\.repo)|(\.sidebarshowignore)|(\.navbarignore)|(\.gitignore)/i];

        this.navbarignore = [commonIgnoreReg];

        // 将用户设置的 ignore 字段新增进上面的 3 个 ignore 中
        ['.sidebarshowignore', '.sidebarfileignore', '.navbarignore'].forEach(ignoreFile => {
            if (fs.existsSync(path.join(currentDir, ignoreFile))) {
                const content = fs.readFileSync(path.join(currentDir, ignoreFile), 'utf8');

                const arr = content.split('\n');

                arr.forEach(item => {
                    if (item) {
                        this[ignoreFile.replace(/^\./, '')].push(item);
                        // this[ignoreFile.replace(/^\./, '')].push(new RegExp(item));
                    }
                });
            }
        });

        return {
            sidebarshowignore: this.sidebarshowignore,
            sidebarfileignore: this.sidebarfileignore,
            navbarignore: this.navbarignore,
        };
    },

    isIgnored(str, ignoreReg) {
        for (let i = 0; i < ignoreReg.length; i++) {
            const exp = ignoreReg[i];
            if (typeof exp === 'object') {
                if (exp.test(str)) {
                    return true;
                }
            } else if (typeof exp === 'string') {
                if (str.indexOf(exp) !== -1) {
                    return true;
                }
            }
        }

        return false;
    }
};