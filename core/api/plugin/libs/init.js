const fs = require('fs');
const path = require('path');

const logUtil = require('../../../tool/log');
const fileUtil = require('../../../tool/file');

module.exports = () => {
    const cwd = process.cwd();
    const demoFileName = 'index-demo.js';
    const pkgJsonFile = path.join(cwd, 'package.json');
    const templateIndexFile = path.join(cwd, demoFileName);

    let createdSomeFiles = false;

    if (!fs.existsSync(pkgJsonFile)) {
        fileUtil.writeFileSync(pkgJsonFile, JSON.stringify({
            name: 'qute-plugin-my-demo',
            description: 'This is a qute plugin demo'
        }));
        logUtil.logGreen(`${pkgJsonFile.green} created!`);

        createdSomeFiles = true;
    }

    if (!fs.existsSync(templateIndexFile)) { // if start
        fileUtil.writeFileSync(templateIndexFile, `
module.exports = ({ commander, quteCacheFolder }) => {
    commander
        .command('my-cmd <param1> [param2]')
        .description('my orders')
        .option('-t, --test', 'test param')
        .action((param1, param2, options) => {
            console.log('param1: ', param1);
            console.log('param2: ', param2);
            console.log('options.test: ', options.test);
        }); 
    };
`
        );

        logUtil.logGreen(`Demo file created: ${demoFileName.green}`);
        createdSomeFiles = true;
    } // if end

    if (createdSomeFiles) {
        logUtil.logGreen('Plugin inited!');
    } else {
        logUtil.logYellow(`File ${'package.json'.yellow} and ${demoFileName.yellow} already exist, skipping creating files.`)
    }

    logUtil.logGreen(`Run ${'v plugin link'.green} for developing locally.`)
};
