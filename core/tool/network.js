/**
 * @file
 * @desc network handlers
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

const dns = require('dns');
const getPort = require('get-port');
const URL = require('url-parse');

module.exports = {
    /**
     * @thunk function
     * @private
     * @desc get free port
     * @param {Number/String} defaultPort
     */
    _getPort(defaultPort) {
        return new Promise(resolve => {
            getPort(defaultPort).then((port) => {
                resolve(port);
            });
        });
    },

    /**
     * @func
     * @desc check whether port was used
     * @param {Number/String} port
     */
    async checkPortUsed(port) {
        const newPort = await this._getPort(port);

        if (parseInt(newPort, 10) === parseInt(port, 10)) {
            return false;
        }

        return true;
    },

    /**
     * @func
     * @desc get free port. It will increase one by one from defaultPort to get free port
     * @param {Number/String} defaultPort
     */
    async getFreePort(defaultPort) {
        const finalPort = await this._getPort(defaultPort);

        if (finalPort !== defaultPort) {
            return await this.getFreePort(defaultPort + 1);
        }

        return defaultPort;
    },

    /**
     * @thunk function
     * @desc check whether url can be reached
     * @param {String} url
     */
    isReachable(url) {
        return new Promise((resolve) => {
            const { hostname } = new URL(url);

            dns.lookup(hostname, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
            const reachableTimer = setTimeout(() => {
                clearTimeout(reachableTimer);
                resolve(false);
            }, 2000);
        });
    },

};
