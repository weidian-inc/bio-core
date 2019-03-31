window.$docsify = {
    loadSidebar: true,
    loadNavbar: true,
    alias: {
        '/.*/_sidebar.md': '/_sidebar.md',
        '/.*/_navbar.md': '/_navbar.md'
    },
    maxLevel: 4,
    auto2top: true,
    // themeColor: '#9B30FF',
    plugins: [
        function (hook, vm) {
            hook.beforeEach(function (content) {
                // 每次开始解析 Markdown 内容时调用
                // ...
                return content
            })

            hook.afterEach(function (html, next) {
                // 解析成 html 后调用。beforeEach 和 afterEach 支持处理异步逻辑
                // ...
                // 异步处理完成后调用 next(html) 返回结果
                next(html)
            })

            // var changeLinkTimer = null;
            hook.doneEach(function () {
                // 每次路由切换时数据全部加载完成后调用，没有参数。
            })

            hook.mounted(function () {
                // 初始化完成后调用 ，只调用一次，没有参数。
            })

            hook.ready(function () {
                // 初始化并第一次加完成数据后调用，没有参数。
            })
        }
    ]
}