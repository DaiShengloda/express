var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '920815',
	database: 'itv_sr'
});
connection.connect();

var sql = 'select * from data where id like "floor%"';
connection.query(sql,function(err,result){
	console.log(result);
});

connection.end();