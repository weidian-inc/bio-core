/**
 * @file
 * @desc APIS
 * @author liuyuanyangscript@gmail.com
 * @date  2017/08/11
 */

module.exports = {
    init: require('./api/init/index'),

    scaffold: {
        run: require('./api/scaffold/run/index'),
        show: require('./api/scaffold/show/index'),
        install: require('./api/scaffold/install/index'),
        rename: require('./api/scaffold/rename/index'),
    },

    set: require('./api/set/index'),

    mock: require('./api/mock/index'),

    lint: require('./api/lint/index'),
};
