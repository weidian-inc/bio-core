/**
 * @file
 * @desc local mock
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const co = require('co');
const fse = require('fs-extra');
const nodestatic = require('node-static');

const networkUtil = require('../../tool/network');

function createDemo(mockDir) {
    const demoPath = path.join(mockDir, 'test.json');

    if (fs.existsSync(demoPath)) {
        return;
    }
    fse.ensureFileSync(demoPath);

    const fd = fs.openSync(demoPath, 'w+');
    fs.writeFileSync(demoPath, JSON.stringify({
        name: 'mock',
        value: 'Hi',
    }, null, '\t'));
    fs.closeSync(fd);
}

/**
 * @func
 * @desc local mock
 * @param {Number} mock port
 */
module.exports = (port = 7000) => {
    co(function* mock() {
        const cwd = process.cwd();

        // check port used info
        const portInUse = yield networkUtil.checkPortUsed(port);

        if (portInUse) {
            console.log(`\n[PORT IN USE] ${port}\n`);
            return;
        }

        const mockDir = path.join(cwd, 'mock');

        fse.ensureDirSync(mockDir);

        createDemo(mockDir);

        const mockfile = new nodestatic.Server(path.join(cwd, './mock'), {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
        });

        require('http').createServer((request, response) => {
            request.addListener('end', () => {
                mockfile.options.headers['Access-Control-Allow-Origin'] = request.headers.origin || '*';
                mockfile.serve(request, response);
            }).resume();
        }).listen(port);

        console.log([
            '\nServer lanched at dir "/mock/" automatically.\n',
            `demo: http://127.0.0.1:${port}/test.json\n`,
        ].join('\n'));
    });
};
