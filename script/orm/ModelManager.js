var sequelize = "sequelize";
var Sequelize = require(sequelize);
var config = require("../config");

var Data = require('./Data.js');

var Promise = require("bluebird");

var config = require('../config.js');
var modelMap = {}; // 管理模型库


var starting = true;

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
        logging: (config.show_sql ? console.log : false)
    });
    this.setSequelize(sequelize);
};

exports.getModelMap = function () {
    return modelMap;
};

exports.addModel = function (model, force) {
    force = force || false;
    modelMap[model.name] = model;
    if (force) {
        console.log(model);
    }
    return model.orm.sync({ force: force }); // 创建表格
};

exports.updateModel = function (newModel) {
    var oldModel = modelMap[newModel.name];
    var flag = true;
    if (oldModel) {
        oldModel.find({}).then(function (data) { // 如果存在数据
            if (data && data.length) {
                flag = false;
            }
        });
    }
    modelMap[newModel.name] = newModel;
    if (flag) {
        return model.orm.sync({ force: flag });
    }
    return Promise.resolve(flag);
};

exports.getModel = function (name) {
    return modelMap[name];
};

exports.initModels = function () {
    var force = config.syncForce;
    var self = this;
    var result = [];

    result.push(self.addModel(new Data.Model(), force));
    
    return Promise.each(result, function (item) {
        return item;
    });
};

exports.getMacAddr = function () {
    return cron.gma();
};

exports.invoke = function (modelName, method, data, t, user, req) {

    if (method === 'list') {
        var list = getList(modelName);
        return Promise.resolve(list).then(function (list) {
            if (!config.enablePermission) {
                return list;
            }
            return modelMap['user'].getServerPermission(data, t, user).then(function (menus) {
                if (!menus || !menus.length) return list;

                //将对象转化为数组
                var userList = [];
                if (list instanceof Array) {
                    userList = list;
                } else {
                    Object.keys(list).forEach(function (key) {
                        userList.push(list[key]);
                    })
                }

                //判断后台显示的目录
                var userMenus = {};
                userList.forEach(function (val) {
                    var id = val.id;
                    if (menus.indexOf(id.toLowerCase()) >= 0) {
                        userMenus[id] = val;
                    }
                });
                return userMenus;
            })
        });
    }

    if (modelName == "general") {
        var m = exports[method];
        return Promise.resolve(m.call(exports, data, t, user));
    }

    var model = modelMap[modelName];
    if (model) {
        if (model[method]) {
            var type = 'model.' + modelName + '.' + method;
            return model[method](data, t, user, req).then(function (r) {
                return Promise.resolve(r);
            });
        }

        return Promise.reject({ code: '10006', message: 'Unknown module[' + modelName + '] or method[' + method + ']' });
    }
    return Promise.reject({ code: '10006', message: 'Unknown module[' + modelName + '] or method[' + method + ']' });
};

exports.addLog = function (record, t) {
    if (record == null) {
        return Promise.resolve({});
    }
    return this.operationLogger.addLog(record, t);
}

exports.isLog = function (model) {
    if (starting) {
        return false;
    }
    if (!config.operationLogEnable) {
        return false;
    }
    return model.isLog();
}

exports.getDefaultTableCharset = function () {

    var c = config.tableCharset || 'utf8';
    return c;
}