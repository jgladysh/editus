var server;

exports.StartServer = function () {
    var restify = require('restify');
    server = restify.createServer();
    var response = function respond(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html');
        res.write("Item_1,Item_2,Item_3,Item_4,Item_5,Item_6,Item_7");
        res.end();
    };

    server.post('/',response);
    server.opts(/\.*/, function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "data, datatype");
        res.header("Access-Control-Allow-Method", "POST");
        res.header("Allow", "POST");
        res.send(200);
        next();
    });

    server.listen(8090);
};

exports.StopServer = function(){
    server.close();
};