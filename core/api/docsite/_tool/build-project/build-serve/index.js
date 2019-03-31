const run = ({ skipSidebar, projectDir }) => {
    if (!projectDir) {
        throw Error('param "projectDir" needed in build-serve');
    }

    const path = require('path');
    const chokidar = require('chokidar');

    const ignoreUtil = require('../../ignore');

    const buildOnce = () => {
        require('../build-once')({ skipSidebar, projectDir });
    };

    const watcher = chokidar.watch(path.join(projectDir, 'docs'), {
        persistent: true,
        ignored: ignoreUtil.sidebarfileignore,
    });

    // listeners
    watcher.on('ready', () => {
        watcher.on('add', (file) => {
            console.log('add: ', file.replace(projectDir, ''));
            buildOnce();
        });
        watcher.on('unlink', (file) => {
            console.log('unlink: ', file.replace(projectDir, ''));
            buildOnce();
        });
        watcher.on('unlinkDir', (file) => {
            console.log('unlinkDir: ', file.replace(projectDir, ''));
            buildOnce();
        });
    });

    buildOnce();
};

module.exports = run;
