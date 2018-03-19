/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 12-10-26
 * Time: 下午3:56
 * To change this template use File | Settings | File Templates.
 */
var net = require('net');
var port = 4001;
var host = '127.0.0.1';

var client= new net.Socket();
// client.setEncoding('binary');
//连接到服务端

// (socket) => {
//   socket.end('goodbye\n');
// }

// function(socket) {
// 	socket.end('');
// }

client.connect(port,host,function(){
  
   var data = {
   	cmd:6001,
   }
    client.write(JSON.stringify(data));

});

var handlerDataFunction = function(data){
    console.log('recv data:'+ data);
    deepHandlerDataFunction();
};

var deepHandlerDataFunction = function(){

};

client.on('data',handlerDataFunction);

/*client.on('error',function(error){

    console.log('error:'+error);
    client.destory();

});
client.on('close',function(){

    console.log('Connection closed');
});*/