var ModelManager = require('./orm/ModelManager.js');

module.exports = function () {
	ModelManager.initSequelize();
	ModelManager.initModels();
}