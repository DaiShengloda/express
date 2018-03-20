var sequelize = "sequelize";
var Sequelize = require(sequelize);
var ModelManager = require('./ModelManager.js');
var Promise = require('bluebird');
var co = require('co');
var util = require('../util');

var Model = function(name, attributes, options, description, element) {
    initModel(this, name, attributes, options, description, element);
};

function initModel(model, name, attributes, options, description, element) {

    model.name = name;
   model.attributes = initAttributes(attributes);
    model.description = description || name;
    model.element = element;
    addFieldToAttributes(attributes);
    options = options || {};
    options.freezeTableName = true;
    model.options = options;
    model.createOrm();
};

function initAttributes(attributes) {
    if (attributes) {
        return attributes;
    }
}

function addFieldToAttributes(attributes) {
    for (var name in attributes) {
        addFieldToAttribute(name, attributes[name]);
    }
}

function addFieldToAttribute(name, attribute) {
    if (attribute.field) {
        return;
    }
    var field = "";
    var lowerCaseName = name.toLowerCase();

    for (var i = 0; i < lowerCaseName.length; i++) {
        if (lowerCaseName.charAt(i) !== name.charAt(i)) {
            field += "_";
        }
        field += lowerCaseName.charAt(i);
    }
    attribute.field = field;
    return attribute;
}

Model.prototype.count = function(data, t) {
    if (!data.where) {
        data = { where: data };
    }
    return this.orm.count(data, { transaction: t })
};

Model.prototype.get = function(data, t) {
    if (!data.where) {
        data = { where: data };
    }
    return this.orm.findOne(data, { transaction: t });
};

Model.prototype.find = function(data, t) {
    return this.orm.findAll(data);
};

Model.prototype.searchAndCount = function(param, t) {
    // console.loog(data)
    if (!param.where) {
        data = {};
        data.where = param;
        if (param.offset !== undefined) {
            data.offset = parseInt(param.offset);
            delete param.offset;
        }
        if (param.limit !== undefined) {
            data.limit = parseInt(param.limit);
            delete param.limit;
        }
        if (param.order !== undefined) {
            data.order = param.order;
            delete param.order;
        }
    } else {
        data = param;
        if (param.offset) {
            data.offset = parseInt(param.offset);
        }
        if (param.limit) {
            data.limit = parseInt(param.limit);
        }
    }
    return this.orm.findAndCountAll(data, { transaction: t })
};

Model.prototype.add = function(data, t, user) {
    var self = this;
    var keyData = this.getKeyData(data);
    if (Object.keys(keyData).length == 0)
        return self.orm.create(data, { transaction: t })
            .then(function(d) {
                d = d.dataValues;
                self.orm.build(d, {});
                util.runDelayTask('refreshCache-' + self.name, 1000, function() {
                    self.refreshCache();
                });
                eventBus.emit('model.' + self.name, { method: 'add', result: d });
                if (!ModelManager.isLog(self)) {
                    return Promise.resolve(d);
                }
                return self.getLogRecord(d, t, 'add', user)
                    .then(function(record) {
                        return ModelManager.addLog(record, t);
                    }).then(function() {
                        return Promise.resolve(d);
                    })
            })
    else
        return this.get(keyData)
            .then(function(d) {
                if (d) {
                    return Promise.reject({code:'10008',message:{message: 'Primary key "'+keyData+'" of '+self.name+' is repeat'}})
                }
                return self.orm.create(data, { transaction: t })
                    .then(function(d) {
                        d = d.dataValues;
                        self.orm.build(d, {});
                        util.runDelayTask('refreshCache-' + self.name, 1000, function() {
                            self.refreshCache();
                        });
                        eventBus.emit('model.' + self.name, { method: 'add', result: d });
                        if (!ModelManager.isLog(self)) {
                            return Promise.resolve(d);
                        }
                        return self.getLogRecord(d, t, 'add', user)
                            .then(function(record) {
                                return ModelManager.addLog(record, t);
                            }).then(function() {
                                return Promise.resolve(d);
                            })
                    })
            })

};

Model.prototype.remove = function(data, t, user) {
    var self = this;
    if (data.where) {
        data = data.where;
    }
    if (Object.keys(data).length == 0) {
        logger.warn('系统异常, 删除数据却没有传入where条件. data=' + JSON.stringify(data));
        return Promise.reject({code:'10004',message: '系统异常, 删除数据却没有传入where条件. data=' + JSON.stringify(data)})
    }
    return this.get(this.clone(data))
        .then(function(d) {
            if (!d) {

                return Promise.reject({code:'10007',message:'remove error: data ' + JSON.stringify(data) + ' had bean removed'})
            }
            if (!ModelManager.isLog(self)) {
                return Promise.resolve(d);
            }
            return self.getLogRecord(d, t, 'remove', user)
                .then(function(record) {
                    return ModelManager.addLog(record, t);
                })
                .then(function() {
                    return Promise.resolve(d);
                })
        })
        .then(function(d) {
            return self.orm.destroy({ where: data }, { transaction: t })
                .then(function() {
                    return Promise.resolve(d);
                })
        })
        .then(function(r) {
            eventBus.emit('model.' + self.name, { method: 'remove', result: r });
            util.runDelayTask('refreshCache-' + self.name, 1000, function() {
                self.refreshCache();
            });
            return Promise.resolve(r);
        });
};

Model.prototype.update = function(data, t, user) {
    var self = this;
    var val, options;
    if (data.options) {
        val = data.value || {};
        options = data.options || {};
    } else {
        options = this.getKeyData(data);
        val = data;
        for (var p in options) {
            delete val[p];
        }
    }
    if (Object.keys(options).length == 0) {
        logger.warn('系统异常, 更新数据却没有传入where条件. val=' + JSON.stringify(val));
    }
    var old;
    return this.get(this.clone(options))
        .then(function(d) {
            if (!d) {
                return Promise.reject({code:'10007',message:'update error: data had bean removed'})
            }
            old = d;
            if (!ModelManager.isLog(self)) {
                return Promise.resolve(d);
            }
            return self.getLogRecord(d, t, 'update', user)
                .then(function(record) {
                    return ModelManager.addLog(record, t)
                })
        })
        .then(function() {
            // return self.orm.update(val, { where: self.clone(options) }, { transaction: t });
            // by alex.修改原因在更新roleOfPermission时会保存，SequelizeDatabaseError: ER_LOCK_WAIT_TIMEOUT
            // 参考https://stackoverflow.com/questions/38183242/sequelize-transactions-er-lock-wait-timeout
            return self.orm.update(val, { where: self.clone(options), transaction: t });
        })
        .then(function() {
            return self.get({ where: self.clone(options) });
        })
        .then(function(r) {
            eventBus.emit('model.' + self.name, { method: 'update', result: r, old: old });
            util.runDelayTask('refreshCache-' + self.name, 1000, function() {
                self.refreshCache();
            });
            return Promise.resolve(r);
        });
};

Model.prototype.keys = ['id'];

Model.prototype.createOrm = function() {
    var name = this.name,
        attributes = this.attributes,
        options = this.options;
    this.orm = ModelManager.sequelize.define(name, attributes, options);
    var build = this.orm.build;
    var jsonFieldMap = {};
    var names = Object.keys(attributes);
    var self = this;
    if (names) {
        names.forEach(function(name) {
            var attribute = attributes[name];
            if (attribute instanceof Object && attribute.json) {
                jsonFieldMap[name] = {
                    encode: attribute.encode || self.encode,
                    decode: attribute.decode || self.decode,
                }
            }
        })
    }
    this.jsonFieldMap = jsonFieldMap;
    var orm = this.orm;
    var oldBuild = orm.build;
    orm.build = function(values, options) {
        if (Array.isArray(values)) {
            return this.bulkBuild(values, options);
        }
        options = options || { isNewRecord: true }
        if (!options.build) {
            var keys = Object.keys(self.jsonFieldMap);
            for (var i = 0; i < keys.length; i++) {
                var p = keys[i];
                if (values[p]) {
                    if (options.isNewRecord) {
                        values[p] = self.jsonFieldMap[p].encode(values[p], p, values);
                    } else {
                        values[p] = self.jsonFieldMap[p].decode(values[p], p, values);
                    }
                }
            }
        } else {
            options.build = true;
        }
        return oldBuild.call(orm, values, options);

    };
};

Model.prototype.encode = function(value, name, values) {
    if (Object.prototype.toString.call(value) === '[object String]') {
        return value;
    } else {
        try {
            return JSON.stringify(value);
        } catch (e) {
            logger.error('encode:' + name + '转换成string失败  - ' + JSON.stringify(e) + '  value=' + value, values)
        }
    }
    return value;
};
Model.prototype.decode = function(value, name, values) {
    try {
        return JSON.parse(value);
    } catch (e) {
        logger.error('decode:' + name + '转换成json失败  - ' + JSON.stringify(e) + '  value=' + value, values)
    }
    return value;
};

exports.Sequelize = Sequelize;
exports.Model = Model;