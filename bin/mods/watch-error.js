module.exports = () => {
    process.on('uncaughtException', (e) => {
        console.log(e);
        process.exit(1);
    });

    process.on('SIGINT', () => {
        process.exit(0);
    });

    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    });
};