/**
 * @file
 * @desc run scaffold
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const isWindows = require('is-windows')();

const ora = require('ora');
const ps = require('ps-node');
const md5 = require('md5');
const killPort = require('kill-port');
const findProcess = require('find-process');
const syncDirectory = require('sync-directory');

const network = require('../../../tool/network');
const pathUtil = require('../../../tool/path');
const scaffoldUtil = require('../../../tool/scaffold');

/**
 * @func
 * @desc sync directory
 * @param {String} from: src dir
 * @param {String} to: target dir
 * @param {Object}
 * @param {Boolean} object.watch: whether listen changes of files and sync files.
 */
const runSyncDirectory = (from, to, { watch }) => {
    const spinner = ora(`${'[bio]'.green} preparing...`).start();

    if (isWindows) {
        try {
            fse.removeSync(to);
        } catch (err) {
            // no content
        }
    }

    const watcher = syncDirectory(from, to, {
        type: isWindows ? 'copy' : 'hardlink',
        watch,
        exclude: [/((\.git)|(\.DS_Store))/i, pathUtil.cacheFolder.replace(/\/$/, '').split('/').pop()],
    });

    spinner.succeed(`${'[bio]'.green} preparation done.`).stop();

    return watcher;
};

const getPkgObj = (folder) => {
    try {
        const pkgJson = path.join(folder, 'package.json');
        const pkgObj = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));

        return pkgObj;
    } catch (err) {
        return {};
    }
};

const checkIfShouldSync = ({ scaffoldFolder, cwd }) => {
    const scaffoldSyncDeclare = getPkgObj(scaffoldFolder)['bio-sync'];
    const cwdSyncDeclare = getPkgObj(cwd)['bio-sync'];

    let shouldSync = true;

    if ((scaffoldSyncDeclare === false || scaffoldSyncDeclare === 'false') || (cwdSyncDeclare === false || cwdSyncDeclare === 'false')) {
        shouldSync = false;
    }

    return shouldSync;
}

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
    const scaffoldFolder = scaffoldUtil.getScaffoldFolder(scaffoldName);

    const pkgScripts = (() => {
        let scripts = {};

        const pkgJsonFile = path.join(scaffoldFolder, 'package.json');

        if (fs.existsSync(pkgJsonFile)) {
            try {
                scripts = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf8')).scripts;
            } catch(err) {
                console.log(err);
            }
        }

        return scripts;
    })();

    let child;

    if (fs.existsSync(path.join(scaffoldFolder, 'bio-entry.js'))) {
        child = require('child_process').fork('bio-entry.js', [
            `taskName=${currentEnv}`,
            `userDir=${cwd}`,
            `srcDir=${workspaceFolder}`,
            `distDir=${path.join(cwd, './build')}`,
            `port=${debugPort}`,

            `currentEnv=${currentEnv}`,
            `userFolder=${cwd}`,
            `srcFolder=${workspaceFolder}`,
            `buildFolder=${path.join(cwd, './build')}`,
            `debugPort=${debugPort}`,
        ], {
            cwd: scaffoldFolder,
            silent: true,
        });
    } else if (fs.existsSync(path.join(scaffoldFolder, 'bio-entry-function.js'))) {
        require(path.join(scaffoldFolder, 'bio-entry-function.js'))({
            taskName: currentEnv,
            userDir: cwd,
            srcDir: workspaceFolder,
            distDir: path.join(cwd, './build'),

            port: debugPort,
            currentEnv,
            userFolder: cwd,
            srcFolder: workspaceFolder,
            buildFolder: path.join(cwd, './build'),
            debugPort,
        });
    } else if (pkgScripts[currentEnv]) {
        // support
        const prefix = [
            `taskName=${currentEnv}`,
            `userDir=${cwd}`,
            `srcDir=${workspaceFolder}`,
            `distDir=${path.join(cwd, './build')}`,
            `port=${debugPort}`,

            `currentEnv=${currentEnv}`,
            `userFolder=${cwd}`,
            `srcFolder=${workspaceFolder}`,
            `buildFolder=${path.join(cwd, './build')}`,
            `debugPort=${debugPort}`,
        ].join(' ');

        child = require('child_process').exec(`${prefix} npm run ${currentEnv}`, {
            // test path
            cwd: scaffoldFolder,
            silent: true,
        });
    } else {
        console.log(`\nScaffold ${scaffoldName.green}'s entry file ${'vbuilder-entry.js'.green} is not found, please check whethor you've inited project with the right scaffold.\n`);
        process.exit(1);
    }

    return child;
};

const killPreProcess = async () => {
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
        return new Promise(resolve => {
            ps.kill(pid, () => resolve() );
        });
    };

    const _killPort = (port) => {
        return new Promise(resolve => {
            findProcess('port', port).then((list) => {
                if (list[0] && list[0].cmd && list[0].cmd.split(' ').indexOf(`userFolder=${process.cwd()}`) !== -1) {
                    killPort(port).then(resolve).catch(resolve);
                } else {
                    resolve();
                }
            });
        });
    };

    const { main: mainId, children } = obj;

    // kill pre children process
    for (let i = 0; i < children.length; i += 1) {
        const item = children[i];

        if (item.pro) {
            await killPro(item.pid);
        }

        if (item.port) { // for suiting old data
            await _killPort(item.port);
        } else if (item.ports) {
            for (let j = 0; j < item.ports.length; j += 1) {
                await _killPort(item.ports[j]);
            }
        }
    }

    // kill pre main process
    await killPro(mainId);
};

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

const watchScaffoldProcess = (scaffoldProcess, syncWatcher, debugPort) => {
    const shouldShowLog = (log) => {
        if (log.indexOf('package in') === -1 && log.indexOf('up to date in') === -1) {
            return true;
        }

        return false;
    };

    const exitMaster = () => {
        if (syncWatcher) {
            syncWatcher.close();
        }
        process.exit(0);
    };

    // master exit when child process exit
    scaffoldProcess.on('exit', () => {
        exitMaster();
    });
    scaffoldProcess.on('error', () => {
        exitMaster();
    });

    // show log of child process
    scaffoldProcess.stdout.setEncoding('utf8');
    scaffoldProcess.stdout.on('data', (data) => {
        if (data) {
            const log = data.toString();
            // remove useless npm log
            if (shouldShowLog(log)) {
                process.stdout.write(log);
            }
        }
    });
    scaffoldProcess.stderr.on('data', (data) => {
        if (data) {
            const log = data.toString();
            if (shouldShowLog(log)) {
                process.stdout.write(log);
            }
        }
    });

    const afterKillPort = () => {
        try {
            process.kill(scaffoldProcess.pid);
        } catch (err) {
            // do nothing
        }

        exitMaster();
    };

    process.on('SIGINT', () => {
        killPort(debugPort).then(afterKillPort).catch(afterKillPort);
    });
};

module.exports = async (currentEnv, { watch = false, scaffold } = {}) => {
    const cwd = process.cwd();

    let scaffoldName = scaffold || scaffoldUtil.getScaffoldNameFromConfigFile();

    if (!scaffoldName) {
        return;
    }

    scaffoldName = scaffoldUtil.getFullName(scaffoldName);

    const scaffoldFolder = scaffoldUtil.getScaffoldFolder(scaffoldName);

    const shouldSync = checkIfShouldSync({ scaffoldFolder, cwd });

    const workspaceFolder = shouldSync ? scaffoldUtil.getWorkspaceFolder({ cwd, scaffoldName }) : cwd;

    // ensure latest scaffold
    scaffoldUtil.ensureScaffoldLatest(scaffoldName);

    const debugPort = await network.getFreePort(9000);

    ora(`${'[bio]'.green} scaffold: ${scaffoldUtil.getShortName(scaffoldName).green}; task: ${currentEnv.green}`).succeed().stop();

    // run 'npm install' when node_modules does not exist
    if (!fs.existsSync(path.join(cwd, 'node_modules'))) {
        const spinner = ora(`${'[bio]'.green} npm installing...`).start();
        require('child_process').execSync(`cd ${cwd} && npm i --silent`);
        spinner.succeed(`${'[bio]'.green} npm installed.`).stop();
    }

    let watcher = null;

    if (shouldSync) {
        watcher = runSyncDirectory(cwd, workspaceFolder, { watch });
    }

    await killPreProcess();

    // run scaffold
    const scaffoldProcess = runScaffold({
        currentEnv,
        cwd,
        workspaceFolder,
        scaffoldName,
        debugPort,
    });

    if (scaffoldProcess) {
        watchScaffoldProcess(scaffoldProcess, watcher, debugPort);

        recordPreProcess(process.pid, [{
            pid: scaffoldProcess.pid,
            ports: [debugPort],
        }]);
    }
};
