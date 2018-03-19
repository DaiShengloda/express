var Sequelize = require('sequelize');
var Promise = require("bluebird");
var config = require("../config");

var modelMap = {};
var Data = require('./Data.js');

exports.setSequelize = function (sequelize) {
    this.sequelize = sequelize;
};

exports.initSequelize = function () {

    starting = true;
    var sequelize = new Sequelize(config.db_config.database, config.db_config.user, config.db_config.password, {
        host: config.db_config.host,
        port: config.db_config.port,
        dialect: 'mysql',
        pool: config.db_config.pool || {
            max: 500,
            min: 0,
            idle: 10000
        },
        timezone: '+08:00',
    });
    this.setSequelize(sequelize);
};

exports.addModel = function (model, force) {
    force = force || false;
    modelMap[model.name] = model;
    if (force) {
        console.log(model);
    }
    return model.orm.sync({ force: force }); // 创建表格
};

exports.initModels = function () {
    var force = config.syncForce;
    var self = this;
    var result = [];
    result.push(self.addModel(new Data.Model(), force));
};

exports.invoke = function (modelName, method, data, t, user, req) {

    var model = modelMap[modelName];
    if (model) {
        if (model[method]) {
            var type = 'model.' + modelName + '.' + method;
            return model[method](data, t, user, req).then(function (r) {
                // eventBus.emit(type, { data: r, user: user });
                return Promise.resolve(r);
            });
        }

        return Promise.reject({ code: '10006', message: 'Unknown module[' + modelName + '] or method[' + method + ']' });
    }
    return Promise.reject({ code: '10006', message: 'Unknown module[' + modelName + '] or method[' + method + ']' });
};