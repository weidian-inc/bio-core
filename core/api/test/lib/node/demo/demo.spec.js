const { expect } = require('chai');

const add = (a, b) => {
    return a + b;
};

describe('test add function', () => {
    beforeEach(() => {
        // ...
    });

    afterEach(() => {
        // ...
    });

    it('test 1 + 1', () => {
        expect(add(1, 1)).to.be.equal(2);
    });

    it('test 2 + 1', () => {
        expect(add(2, 1)).to.be.equal(3);
    });
});
