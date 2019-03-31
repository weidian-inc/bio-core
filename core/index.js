/**
 * @file
 * @desc APIS
 * @author https://github.com/hoperyy
 * @date  2017/08/11
 */

module.exports = {
    init: require('./api/init/index'),

    scaffold: {
        run: require('./api/scaffold/run/index'),
        show: require('./api/scaffold/show/index'),
        install: require('./api/scaffold/install/index'),
        rename: require('./api/scaffold/rename/index'),
        util: require('./api/scaffold/util/index'),
    },

    set: require('./api/set/index'),

    mock: require('./api/mock/index'),

    lint: require('./api/lint/index'),

    hook: require('./api/hook/index'),

    test: require('./api/test/index'),

    docsite: {
        init: require('./api/docsite/init/index'),
        serve: require('./api/docsite/serve/index'),
        push: require('./api/docsite/push/index'),
        clear: require('./api/docsite/clear/index'),
    },

    plugin: require('./api/plugin/index'),
};
