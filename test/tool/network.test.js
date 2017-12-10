const co = require('co');

const { expect } = require('chai');
const networkUtil = require('../../core/tool/network');

describe('test bio-cmd/tool/network.js function isReachable', () => {
    const { isReachable } = networkUtil;

    it('test is reachable: https://github.com', () => {
        return co(function* () {
            const reachable = yield isReachable('https://github.com');
            return reachable;
        }).then((reachable) => {
            expect(reachable).to.be.equal(true);
        });
    });

    it('test not reachable: https://github.co2m', () => {
        return co(function* () {
            const reachable = yield isReachable('https://github.co2m');
            return reachable;
        }).then((reachable) => {
            expect(reachable).to.be.equal(false);
        });
    });
});

describe('test bio-cmd/tool/network.js function _getPort', () => {
    it('test _getPort: default port is 80 and final port is not 80', () => {
        return co(function* () {
            return yield networkUtil._getPort(80);
        }).then((port) => {
            expect(port).to.not.be.equal(80);
        });
    });

    it('test _getPort: default port is 9527 and final port is 9527', () => {
        return co(function* () {
            return yield networkUtil._getPort(9527);
        }).then((port) => {
            expect(port).to.be.equal(9527);
        });
    });
});

describe('test bio-cmd/tool/network.js function checkPortUsed', () => {
    it('test checkPortUsed: port 80 is used', () => {
        return co(function* () {
            return yield networkUtil.checkPortUsed(80);
        }).then((used) => {
            expect(used).to.be.equal(true);
        });
    });

    it('test checkPortUsed: port 9527 is free', () => {
        return co(function* () {
            return yield networkUtil.checkPortUsed(9527);
        }).then((used) => {
            expect(used).to.be.equal(false);
        });
    });
});

describe('test bio-cmd/tool/network.js function getFreePort', () => {
    it('test getFreePort: default port is 80 and final port is not 80', () => {
        return co(function* () {
            return yield networkUtil.getFreePort(80);
        }).then((port) => {
            expect(port).to.not.be.equal(80);
        });
    });

    it('test getFreePort: default port is 9527 and final port is 9527', () => {
        return co(function* () {
            return yield networkUtil.getFreePort(9527);
        }).then((port) => {
            expect(port).to.be.equal(9527);
        });
    });
});
