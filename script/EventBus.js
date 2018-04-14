var EventEmitter = require('events');

// var Logger = require('./Logger'),
var path = require('path');
    // logger = Logger.getLogger(path.basename(__filename, '.js'));

var emitter = new EventEmitter();

exports.on = function(event, callback){
	emitter.on(event, callback);
}

exports.emit = function(event, data){
	try{
		emitter.emit(event, data);
	}catch(e){
		logger.error(e.message, e);
	}
	
}

exports.removeListener = function(event, listener){
	emitter.removeListener(event, listener);
}