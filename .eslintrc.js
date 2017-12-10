module.exports = {
    extends: [
        'airbnb-base',
    ],
    rules: {
        'import/no-dynamic-require': 0,
        'global-require': 0,
        'prefer-destructuring': [
            'error',
            {
                object: true,
                array: false,
            },
        ],
        'no-underscore-dangle': 0,
        'no-lonely-if': 0,
        'max-len': 0,
        'arrow-body-style': 0,
        'object-curly-newline': 0,
        'no-console': 0,
        indent: [
            'error',
            4,
        ],
    },
    env: {
        node: true,
        browser: true,
    },
};
