module.exports = {
    "root": true,
    "env": {
        "commonjs": true,
        "browser": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/essential"
    ],
    "parserOptions": {
        "parser": "babel-eslint",
        "ecmaVersion": 2017,
        "sourceType": "module"
    },
    "rules": {
        "one-var": 0,
        "no-var": 1,
        "semi": [
            1,
            "always",
            {
                "omitLastInOneLineBlock": true
            }
        ],
        "max-len": 0,
        "comma-dangle": 0,
        "func-names": 0,
        "prefer-const": 0,
        "arrow-body-style": 0,
        "no-param-reassign": 0,
        "no-return-assign": 0,
        "no-underscore-dangle": [
            1,
            {
                "allowAfterThis": true
            }
        ],
        "consistent-return": 0,
        "no-unused-expressions": 0,
        "no-multiple-empty-lines": [
            1,
            {
                "max": 2
            }
        ],
        "prefer-template": 1,
        "camelcase": [
            1,
            {
                "properties": "never"
            }
        ],
        "indent": [
            1,
            2,
            {
                "SwitchCase": 1
            }
        ],
        "chonsistent-this": 0,
        "keyword-spacing": [
            1,
            {
                "before": true,
                "after": true
            }
        ],
        "space-in-parens": [
            1,
            "never"
        ],
        "space-infix-ops": [
            1,
            {
                "int32Hint": false
            }
        ],
        "space-before-blocks": [
            1,
            "always"
        ],
        "key-spacing": [
            1,
            {
                "beforeColon": false,
                "afterColon": true
            }
        ],
        "eqeqeq": 1
    }
}

