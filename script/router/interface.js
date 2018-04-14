var config = require('../config');
var ModelManager = require('../orm/ModelManager.js');

module.exports = function(app) {

    app.put(config.api + '/loda', function (req, res) {
        res.end('Hello Loda') 
    });

	app.post(config.api + '/loda', function (req, res) {
        res.json(req.body); 
    });

	//增加数据, 单个或者批量
	app.post(config.api + '/asset', function (req, res) {
		var objs = req.body || {}, datas, isArray;
		if (objs.data) {
			datas = objs.data || [];
			isArray = true;
			if (!util.isArray(datas)) {
				datas = [datas];
			}
		} else {
			isArray = false;
			datas = [objs];
		}

		/* 遍历数据验证数据，验证每条资产，如果一条不通过全部返回，验证规则如下
		*	id: required, 不能重复
		* 	name: required
		*	parentId: required，并存在data表中
		* 	dataTypeId: required，并存在dataType表中
		*/
		if (config.strict) {
			var asset, fail = false, error;
			for (var i = 0; i < datas.length; i++) {
				asset = datas[i];
				if (!asset.id) {
					fail = true;
					error = { reason: '资产编号必需', item: asset };
					break;
				}
				if (cacheServer.isExist('assetIds', asset.id)) {
					fail = true;
					error = { reason: '资产编号已存在', item: asset };
					break;
				}
				if (!asset.name) {
					fail = true;
					error = { reason: '资产名称必需', item: asset };
					break;
				}
				if (!asset.parentId) {
					fail = true;
					error = { reason: '资产父亲必需', item: asset };
					break;
				}
				if (!cacheServer.isExist('assetIds', asset.parentId)) {
					fail = true;
					error = { reason: '资产的父亲编号不存在系统中', item: asset };
					break;
				}
				if (!asset.dataTypeId) {
					fail = true;
					error = { reason: '资产类型必需', item: asset };
					break;
				}
				if (!cacheServer.isExist('assetTypeIds', asset.dataTypeId)) {
					fail = true;
					error = { reason: '资产类型不存在系统中', item: asset };
					break;
				}
			}
			if (fail) {
				res.json({ value: "fail", error: error.reason, item: error.item });
				return;
			}
		}


		var _event = req.query._event;
		var _user = req.query._user;
		ModelManager.sequelize.transaction(function (t) {
			var user = 'admin';
			return ModelManager.invoke('data', 'add', objs, t, user);
		}).then(function (result) {
			res.json({ value: result, error: null });
		}).catch(function (err) {
			res.json({ value: null, error: err.message });
		});

		// var service = assetServer.getInstance();
		// service.saveDB(datas, 'batchAddDataWithCustom', function (error, result) {
		// 	//单个资产
		// 	if (result && !isArray) {
		// 		result = result[0];
		// 	}
		// 	res.json({ value: result, error: error });
		// 	if (!error) {
		// 		if (result) {
		// 			result._event = _event;
		// 			result._user = _user;
		// 		}
		// 		service.handleAsset(result, E.ADD_ASSET);

		// 		// 接口日志相关 add by lyz
		// 		for (var i = 0; i < result.length; i++) {
		// 			// console.log(result[i]);
		// 			var data = {
		// 				module: 'data',
		// 				type: 'add',
		// 				target: result[i].id,
		// 				description: result[i].name,
		// 				// categoryId: 'categoryId',
		// 				dataTypeId: result[i].dataTypeId,
		// 				user: 'admin',
		// 			}
		// 			ModelManager.sequelize.transaction(function (t) {
		// 				return ModelManager.addLog(data, t);
		// 			});
		// 		}
		// 	}
		// });
	});

	//查询资产
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