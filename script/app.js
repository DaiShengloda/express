var http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app);

//body-parsing填充req.body   
var bodyParser = require('body-parser');
var multer = require('multer'); 

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// app.use(multer()); // for parsing multipart/form-data

var readyDB = require('./readyDB.js');
var monitorRouter = require('./router/interface');

readyDB();
monitorRouter(app);

app.use('/', express.static(__dirname + '/../public'));

server.listen(3000);