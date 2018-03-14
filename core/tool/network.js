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
        return (done) => {
            getPort(defaultPort).then((port) => {
                done(null, port);
            });
        };
    },

    /**
     * @func
     * @desc check whether port was used
     * @param {Number/String} port
     */
    checkPortUsed: function* checkPortUsed(port) {
        const newPort = yield this._getPort(port);

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
    getFreePort: function* getFreePort(defaultPort) {
        const finalPort = yield this._getPort(defaultPort);

        if (finalPort !== defaultPort) {
            return yield this.getFreePort(defaultPort + 1);
        }

        return defaultPort;
    },

    /**
     * @thunk function
     * @desc check whether url can be reached
     * @param {String} url
     */
    isReachable(url) {
        const { hostname } = new URL(url);
        return (done) => {
            dns.lookup(hostname, (err) => {
                if (err) {
                    done(null, false);
                } else {
                    done(null, true);
                }
            });
            const reachableTimer = setTimeout(() => {
                clearTimeout(reachableTimer);
                done(null, false);
            }, 2000);
        };
    },

};
