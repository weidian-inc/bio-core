const ora = require('ora');

let globalSpinner = ora();

// globalSpinner.hideCursor();

module.exports = {
    start(content) {
        return globalSpinner.start(`${'[bio]'.green} ${content}`);
    },
    succeed(content) {
        return globalSpinner.succeed(`${'[bio]'.green} ${content}`);
    },
    warn(content) {
        return globalSpinner.succeed(`${'[bio]'.yellow} ${content}`);
    },
    fail(content) {
        return globalSpinner.fail(`${'[bio]'.red} ${content}`);
    },
    stop() {
        return globalSpinner.stop();
    },
    clear() {
        return globalSpinner.clear();
    },
    logWhite() {
        const args = Array.prototype.slice.apply(arguments);
        console.log('[bio]', ...args);
    },
    logGreen() {
        const args = Array.prototype.slice.apply(arguments);
        console.log('[bio]'.green, ...args);
    },
    logYellow() {
        const args = Array.prototype.slice.apply(arguments);
        console.log('[bio]'.yellow, ...args);
    },
    logRed() {
        const args = Array.prototype.slice.apply(arguments);
        console.log('[bio]'.red, ...args);
    },
    // createSpinner() {
    //     return ora();
    // },
    getGlobalSpinner() {
        return globalSpinner;
    },
    // resetGlobalSpinner() {
    //     return globalSpinner = ora();
    // }
};
