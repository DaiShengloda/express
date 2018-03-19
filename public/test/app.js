//四、项目开发实例
//4.1 编写启动脚本
var express=require('express');
var app=express();

app.set('port',process.env.PORT||3000);
app.set('views',path.join(__dirname,'view'));
app.set('view engine','jade');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(app.router);

app.use(express.static(path.join(__dirname,'public')));

app.listen(app.get('port'));