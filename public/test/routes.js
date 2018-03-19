//生成本地模块并暴露api
module.exports=function(app){
	//根目录的路由
	app.get('/',function(req,res){
		res.send('Hello World');
	});
	//customer目录下的路由
	app.get('/customer',function(req,res){
		res.send('customer page');
	});
	//admin目录下的路由
	app.get('/admin',function(req,res){
		res.send('admin page');
	});
};