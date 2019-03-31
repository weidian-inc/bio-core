module.exports = () => {
    const semver = require('semver');
    const requiredVersion = require('../../package.json').engines.node

    if (!semver.satisfies(process.version, requiredVersion)) {
        console.log(
            `\nYou are using Node ${process.version}, but this version of qute-cli requires Node ${requiredVersion}.\nPlease upgrade your Node version.\n`.yellow)
        process.exit(1)
    }
};
