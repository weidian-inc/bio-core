/**
 * @file
 * @desc lint project
 * @author liuyuanyangscript@gmail.com https://github.com/hoperyy
 * @date  2017/08/11
 */

const co = require('co');

const inquirer = require('inquirer');

const typescript = require('./lib/typescript/index');
const node = require('./lib/node/index');

const select = () => {
    return (done) => {
        inquirer.prompt([{
            type: 'list',
            name: 'name',
            message: 'Select unitest type',
            choices: [
                'typescript unitest',
                'node unitest'
            ]
        }]).then((answers) => {
            done(null, answers.name);
        });
    }
};

/**
 * @func
 * @desc lint
 */
module.exports = () => {
    co(function* init() {
        const typename = yield select();
        if (typename === 'typescript unitest') {
            yield typescript.init();
        } else if (typename === 'node unitest') {
            yield node.init();
        }
    });
};
