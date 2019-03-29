module.exports = {
    extends: 'eslint:recommended',
    env: {
        node: true,
        es6: true,
        mocha: true,
    },
    parserOptions: {
        ecmaVersion: 8
    },
    rules: {
        'no-console': 'off',
    },
};