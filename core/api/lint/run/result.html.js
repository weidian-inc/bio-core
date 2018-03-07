module.exports = ({ stylelintResultSrcFile, eslintResultSrcFile, statusResultSrcFile, port }) => {
    if (port) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="ie=edge">
                <title>Stylelint Report</title>
                <style>
                ul, li {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                #tab, #content {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px 20px;
                }

                #tab {
                    font-size: 0;
                }

                #tab li {
                    box-sizing: border-box;
                    display: inline-block;
                    width: 50%;
                    font-size: 20px;
                    text-align: center;
                    height: 50px;
                    line-height: 50px;
                    border: 2px solid #ccc;
                    cursor: pointer;
                }

                #tab li.current {
                    border-color: black;
                }

                #content li {
                    display: none;
                }

                #content li.current {
                    display: block;
                }
                </style>
                <script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"></script>
                <script src="https://cdn.bootcss.com/socket.io/2.0.1/socket.io.js"></script>
                <script>
                    var socket = io.connect('http://127.0.0.1:${port}', {
                        reconnection: true
                    });
                    socket.on('connect', function () {
                        socket.on('update', function (data) {
                            $('#stylelint-status').html(data.stylelint.status);
                            $('#stylelint-result').html(data.stylelint.result);
                            $('#eslint-status').html(data.eslint.status);
                            $('#eslint-result').html(data.eslint.result);

                            $('#status-iframe').attr('src', $('#status-iframe').attr('src'));
                            $('#stylelint-iframe').attr('src', $('#stylelint-iframe').attr('src'));
                            $('#eslint-iframe').attr('src', $('#eslint-iframe').attr('src'));
                        });
                    });
                </script>
            </head>
            <body>
                <ul id="tab">
                    <li>
                        ESlint
                        <span id="stylelint-status"></span>
                        <span id="stylelint-result"></span>
                    </li>
                    <li>
                        Stylelint
                        <span id="eslint-status"></span>
                        <span id="eslint-result"></span>
                    </li>
                </ul>
                <iframe id="status-iframe" style="width:100%;height: 55px;" src="${statusResultSrcFile}" frameborder="0"></iframe>
                <ul id="content">
                    <li>
                        <iframe id="stylelint-iframe" style="width:100%;height:100vh;" src="${eslintResultSrcFile}" frameborder="0"></iframe>
                    </li>
                    <li>
                        <iframe id="eslint-iframe" style="width:100%;height:100vh;" src="${stylelintResultSrcFile}" frameborder="0"></iframe>
                    </li>
                </ul>
                <script>
                    var tabs = $('#tab li');
                    var contents = $('#content li');
                    tabs.click(function(ev) {
                        var $this = $(this);
                        tabs.removeClass('current');
                        $this.addClass('current');

                        var index = $this.index();

                        contents.removeClass('current');
                        contents.eq(index).addClass('current');
                    });

                    tabs.eq(0).click();
                </script>
            </body>
            </html>
        `;
    }
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="ie=edge">
                <title>Stylelint Report</title>
                <style>
                ul, li {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                #tab, #content {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px 20px;
                }

                #tab {
                    font-size: 0;
                }

                #tab li {
                    box-sizing: border-box;
                    display: inline-block;
                    width: 50%;
                    font-size: 20px;
                    text-align: center;
                    height: 50px;
                    line-height: 50px;
                    border: 2px solid #ccc;
                    cursor: pointer;
                }

                #tab li.current {
                    border-color: black;
                }

                #content li {
                    display: none;
                }

                #content li.current {
                    display: block;
                }
                </style>
                <script src="https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"></script>
            </head>
            <body>
                <ul id="tab">
                    <li>
                        ESlint
                        <span id="stylelint-status"></span>
                        <span id="stylelint-result"></span>
                    </li>
                    <li>
                        Stylelint
                        <span id="eslint-status"></span>
                        <span id="eslint-result"></span>
                    </li>
                </ul>
                <iframe id="status-iframe" style="width:100%;height: 55px;" src="${statusResultSrcFile}" frameborder="0"></iframe>
                <ul id="content">
                    <li>
                        <iframe id="stylelint-iframe" style="width:100%;height:100vh;" src="${eslintResultSrcFile}" frameborder="0"></iframe>
                    </li>
                    <li>
                        <iframe id="eslint-iframe" style="width:100%;height:100vh;" src="${stylelintResultSrcFile}" frameborder="0"></iframe>
                    </li>
                </ul>
                <script>
                    var tabs = $('#tab li');
                    var contents = $('#content li');
                    tabs.click(function(ev) {
                        var $this = $(this);
                        tabs.removeClass('current');
                        $this.addClass('current');

                        var index = $this.index();

                        contents.removeClass('current');
                        contents.eq(index).addClass('current');
                    });

                    tabs.eq(0).click();
                </script>
            </body>
            </html>
        `;
};
