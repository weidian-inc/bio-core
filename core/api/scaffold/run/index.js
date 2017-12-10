/**
 * @file
 * @desc run scaffold
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');

const co = require('co');
const ora = require('ora');
const ps = require('ps-node');
const md5 = require('md5');
const killPort = require('kill-port');
const findProcess = require('find-process');
const syncDirectory = require('sync-directory');

const network = require('../../../tool/network');
const pathUtil = require('../../../tool/path');
const scaffoldUtil = require('../../../tool/scaffold');

require('child-process-close');

/**
 * @func
 * @desc check whether config file exists or formatted in current dir. It will throw Error when config file does not exist or formatted.
 * @param {String} cwd. current dir path
 * @param {String} configName. config file name
 */
const checkConfig = (cwd, configName) => {
    const configFile = path.join(cwd, configName);

    if (!fs.existsSync(configFile)) {
        throw Error(`${configName} not found in current directory, please init first.`);
    }
    try {
        JSON.parse(fs.readFileSync(configFile).toString());
    } catch (err) {
        throw Error(`Fail to read ${configName}, please check this file content is JSON formatted `, err);
    }
};

/**
 * @func
 * @desc get scaffold name from config file
 * @param {String} configFile. config file path
 * @return {String} scaffold name
 */
const getScaffoldName = (configFile) => {
    return JSON.parse(fs.readFileSync(configFile).toString()).scaffold;
};

/**
 * @func
 * @desc check whether scaffold exists in local. It will throw Error when scaffold does not exist.
 * @param {String} configFile. config file path
 * @param {String} configName. config file name
 */
const checkScaffoldExist = (configFile, configName) => {
    // get scaffold name
    const scaffoldName = getScaffoldName(configFile);

    // check scaffold name
    if (!scaffoldName) {
        throw Error(`key "scaffold" not found in ${configName}, please check.`);
    }
};

/**
 * @func
 * @desc sync directory
 * @param {String} from: src dir
 * @param {String} to: target dir
 * @param {Object}
 * @param {Boolean} object.watch: whether listen changes of files and sync files.
 */
const runSyncDirectory = (from, to, { watch }) => {
    const spinner = ora('file synchronization running...').start();
    const watcher = syncDirectory(from, to, {
        type: 'hardlink',
        watch,
        exclude: [/((\.git)|(\.DS_Store))/i, pathUtil.cacheFolder.replace(/\/$/, '').split('/').pop()],
    });

    spinner.succeed('file synchronization done.').stop();

    return watcher;
};

/**
 * @func
 * @desc run scaffold
 * @param {Object}
 * @param {String} object.currentEnv: current env when running scaffold
 * @param {String} object.cwd: current dir path
 * @param {String} object.workspaceFolder: workspace dir path
 * @param {Number} object.debugPort: used port when running scaffold
 * @param {String} object.scaffoldName: scaffold name ( full name )
 */
const runScaffold = ({ currentEnv, cwd, workspaceFolder, debugPort, scaffoldName }) => {
    const scaffoldFolder = pathUtil.getScaffoldFolder(scaffoldName);

    const child = require('child_process').fork('bio-entry.js', [
        `taskName=${currentEnv}`,
        `userDir=${cwd}`,
        `srcDir=${workspaceFolder}`,
        `distDir=${path.join(cwd, './build')}`,
        `port=${debugPort}`,
    ], {
        cwd: scaffoldFolder,
        silent: true,
    });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
        if (data) {
            console.log(data.toString());
        }
    });

    child.stderr.on('data', (data) => {
        if (data) {
            console.log(data.toString());
        }
    });

    return child;
};

/**
 * @func
 * @desc kill pre process running on current dir
 */
const killPreProcess = function* killPreProcess() {
    // get local pre process
    const preProcessRecordFile = path.join(pathUtil.cacheFolder, 'pre-process-record.json');

    if (!fs.existsSync(preProcessRecordFile)) {
        return;
    }

    const map = JSON.parse(fs.readFileSync(preProcessRecordFile).toString());
    const obj = map[md5(process.cwd())];

    if (!obj) {
        return;
    }

    const killPro = (pid) => {
        return (done) => {
            // TODO check this process is lanched by bio-core
            // ps.lookup({ pid }, (err, resultList) => {
            //
            // });

            ps.kill(pid, () => {
                done(null);
            });
        };
    };

    const _killPort = (port) => {
        return (done) => {
            findProcess('port', port).then((list) => {
                if (list[0] && list[0].cmd && list[0].cmd.split(' ').indexOf(`userFolder=${process.cwd()}`) !== -1) {
                    killPort(port).then(() => {
                        done();
                    }).catch(() => {
                        done();
                    });
                } else {
                    done();
                }
            });
        };
    };

    const { main: mainId, children } = obj;

    // kill pre children process
    for (let i = 0; i < children.length; i += 1) {
        const item = children[i];

        if (item.pro) {
            yield killPro(item.pid);
        }

        if (item.port) { // for suiting old data
            yield _killPort(item.port);
        } else if (item.ports) {
            for (let j = 0; j < item.ports.length; j += 1) {
                yield _killPort(item.ports[j]);
            }
        }
    }

    // kill pre main process
    yield killPro(mainId);
};

/**
 * @func
 * @desc record pid and ports used in current pid, for use of killing them next time when running scaffold in the same dir
 * @param {String} main: pid of current process
 * @param {Array} children
 * @param {Number} children[0].pid: pid of child process
 * @param {Array} children[0].ports: ports used by child process
 */
const recordPreProcess = (main, children) => {
    const preProcessRecordFile = path.join(pathUtil.cacheFolder, 'pre-process-record.json');
    const fd = fs.openSync(preProcessRecordFile, 'w+');
    const obj = {};
    obj[md5(process.cwd())] = {
        main,
        children,
    };

    fs.writeFileSync(preProcessRecordFile, JSON.stringify(obj));
    fs.close(fd);
};

/**
 * @func
 * @desc run scaffold
 * @param {String} currentEnv: current env when running scaffold
 * @param {Object}
 * @param {String} object.configName: config file of current dir. '.biorc' by default
 * @param {Boolean} object.watch: whether listen changes of files and sync files from current project dir to scaffold workspace. 'false' by default
 */
module.exports = (currentEnv, { configName = pathUtil.configName, watch = false } = {}) => {
    co(function* run() {
        const cwd = process.cwd();
        const configFile = path.join(cwd, configName);

        checkConfig(cwd, configName);
        checkScaffoldExist(configFile, configName);

        const scaffoldName = scaffoldUtil.getFullName(getScaffoldName(configFile));
        const workspaceFolder = pathUtil.getWorkspaceFolder({ cwd, scaffoldName });

        // ensure latest scaffold
        scaffoldUtil.ensureScaffoldLatest(scaffoldName);

        const watcher = runSyncDirectory(cwd, workspaceFolder, { watch });

        yield killPreProcess();

        const debugPort = yield network.getFreePort(9000);

        console.log(`\nscaffold: ${scaffoldUtil.getShortName(scaffoldName).green}; task: ${currentEnv.green}\n`);

        // run scaffold
        const scaffoldProcess = runScaffold({
            currentEnv,
            cwd,
            workspaceFolder,
            scaffoldName,
            debugPort,
        });

        recordPreProcess(process.pid, [{
            pid: scaffoldProcess.pid,
            ports: [debugPort],
        }]);

        const afterKillPort = () => {
            try {
                process.kill(scaffoldProcess.pid);
            } catch (err) {
                // do nothing
            }

            if (watcher) {
                watcher.close();
            }
            process.exit();
        };

        process.on('SIGINT', () => {
            killPort(debugPort).then(() => {
                afterKillPort();
            }).catch(() => {
                afterKillPort();
            });
        });
    });
};
