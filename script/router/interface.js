var config = require('../config');
var ModelManager = require('../orm/ModelManager.js');

module.exports = function(app) {
    // app.get('/', function (req, res) {
    //     res.json({ error: null, value: 'success' });
    // })

    app.put(config.api + '/loda', function (req, res) {
        res.end('Hello Loda') 
    });

    app.get(config.api + '/asset', function (req, res) {
		ModelManager.sequelize.transaction(function (t) {
			var user = 'admin';
			return ModelManager.invoke('data', 'searchAndCount', req.query, t, user);
		}).then(function (result) {
			res.json({ value: result, error: null });
		}).catch(function (err) {
			res.json({ value: null, error: err.message });
		});
	});

	app.get(config.api + '/find', function (req, res) {
		ModelManager.sequelize.transaction(function (t) {
			var user = 'admin';
			return ModelManager.invoke('data', 'find', req.query, t, user);
		}).then(function (result) {
			res.json({ value: result, error: null });
		}).catch(function (err) {
			logger.error(err);
			res.json({ value: null, error: err.message });
		});
	});
};