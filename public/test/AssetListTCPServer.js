var net = require('net');
var server = net.createServer();
var port = 4001;
/*server.on('listening', function() {
    console.log('Server is listening on port', port);
});*/

server.on('connection', function(socket) {
    console.log('Server has a new connection');
    // socket.end();
    // server.close();

   socket.on('data', function(data) {
        // got data
        //console.log(data);
        console.log(data.toString());
        var result = [
        	{
        		eqId:"001",
        		name:"001"
        	},{
        		eqId:"002",
        		name:"002"
        	},{
        		eqId:"003",
        		name:"003"
        	},{
        		eqId:"004",
        		name:"004中文"
        	}
        ]
        //console.log(JSON.stringify(result));
        socket.write(JSON.stringify(result));

    });
    //socket.on('end', function(data) {
        // connection closed
    //});

});
/*server.on('close', function() {
    console.log('Server is now closed');
});
server.on('error', function(err) {
    console.log('Error occurred:', err.message);
});*/

server.listen(port);


