var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app);

var readyDB = require('./readyDB.js');
var monitorRouter = require('./router/interface');

readyDB();
monitorRouter(app);

app.use('/', express.static(__dirname + '/../public'));

server.listen(3000);