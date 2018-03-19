//二、运行原理
//2.1底层：http模块
//2.2中间件
//2.3 use方法--express注册中间体方法，返回函数；
var express=require('express');
var http=require('http');

var app=express();

app.use('/about',function(req,res,next){
    //console.log("In comes a"+req.method+"to"+req.url);
    //next();
    
    //实现简单路由
    	console.log(req.method+' '+req.url);
    	res.writeHead(200,{"Content-Type":"text/plain"});
    	res.end("Hello about");
});

app.use('/',function(req,res,next){
	//res.writeHead(200,{"Content-Type":"text/plain"});
	//res.end("Hello express");
		console.log(req.method+' '+req.url);
    	res.writeHead(200,{"Content-Type":"text/plain"});
    	res.end("Hello express");
});

app.use(function(req,res){
    res.writeHead(404,{"Content-Type":"text/plain"});
    res.end("404 not found!");
});

app.listen(1337);