module.exports = {
    extends: [
        'eslint-config-airbnb-es5',
        'plugin:vue/essential'
    ],
    parserOptions: {
        parser: 'babel-eslint',
        ecmaVersion: 2017,
        sourceType: 'module'
    },
    rules: {
        eqeqeq: [
            2,
            'allow-null'
        ]
    }
}