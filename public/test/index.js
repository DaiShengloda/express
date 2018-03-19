//一.概述
//express框架
var express=require('express');
var app=express();

//访问指定目录下的文件
//app.use(express.static(__dirname +'/public'));


//生成动态网页--根路径路由routing
app.get('/',function(req,res){
	res.send('Hello express');
});

//请求本地模块
//var routes=require('./routes');
//routes(app);

app.listen(8080);

//http模块
/*var http=require('http');
var app=http.createServer(function(req,res){
    res.writeHead(200,{"Content-Type":"text/plain"});
    res.end("Hello http");
});
app.listen(8080);*/