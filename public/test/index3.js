//三、express的方法
//3.1 all方法和http动词方法;get--指定路由；
var express=require("express");
var app=express();
var http=require("http");

/*app.all('*',function(req,res,next){
	res.writeHead(200,{"Content-Type":"text/plain"});
	next();
});

app.get("/",function(req,res){
	res.end("Hello homePage");
});

app.get("/about",function(req,res){
	res.end("Hello aboutPage");
});

app.get('/hello/:who?',function(req,res){
	if (req.params.id){
		res.end("Hello,"+req.params.who+".");
	}else{
		res.end("Hello,Guest.");
	}
});

app.get('*',function(req,res){
	res.end("404 error!");
});*/


//3.2 set方法
app.set('views',__dirname+'/views');


//3.3 response对象
//3.3.1 response.redirect方法
/*response.redirect("/hello/anime");
response.redirect("http://www.example.com");
response.redirect(301, "http://www.example.com");*/

//3.3.2 response.sendFile方法
//response.sendFile('/path/to/anime.mp4');

//3.3.3 response.render方法
/*app.get('/',function(req,res){
    res.render('index',{message:'Hello response'});
});*/



//3.4 request对象
//3.4.1 request.ip属性
app.get('/',function(request,response){
    console.log(request.ip);
    response.end(request.ip);
});

//3.4.2 request.files属性



//3.5 搭建https服务器
/*var fs = require('fs');
var options = {
  key: fs.readFileSync('E:/ssl/myserver.key'),
  cert: fs.readFileSync('E:/ssl/myserver.crt'),
  passphrase: '1234'
};*/

var https=require('https');
app.get('/https',function(req,res){
	res.end("Hello https_express");
});

//var server = https.createServer(options, app);
//server.listen(8084);

http.createServer(app).listen(8080);