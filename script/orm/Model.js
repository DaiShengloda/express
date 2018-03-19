var sequelize = "sequelize";
var Sequelize = require(sequelize);
var ModelManager = require('./ModelManager.js');
var Promise = require('bluebird');
var co = require('co');
var util = require('../util');
// var logger = require('../Logger').getLogger(require('path').basename(__dirname, '.js'));
// var eventBus = require('../EventBus');

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
    // options.charset = ModelManager.getDefaultTableCharset();
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

Model.prototype.exist = function(data, t) {
    if (!data.where) {
        data = { where: data };
    }
    return this.orm.findOne(data, { transaction: t }).then(function(data) {
        return Promise.resolve({ valid: !data });
    });
};

Model.prototype.find = function(data, t) {
    return this.orm.findAll(data);
};

Model.prototype.search = function(data, t) {
    data = data || {};
    if (!data.where) {
        data = { where: data };
    }
    return this.find(data, t);
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
}

/**
 * 拼接操作日志的json对象
 * data比较特殊,是操作对象的主要数据来源,为data额外记录dataTypeId和categoryId,方便检索
 * @param data
 * @param t
 * @param type
 * @param user
 * @returns {Promise.<{module: *, type: *, target: *, description: string, user: *, targetInfo: *}>}
 */
Model.prototype.getLogRecord = function(data, t, type, user) {
    var v = data.dataValues || data;
    if (v.id == null) {
        return Promise.resolve(null);
    }
    var desc = '';
    if (type == 'add') {
        desc = '增加:' + v.id;
    } else if (type == 'update') {
        desc = '编辑:' + v.id;
    } else if (type == 'remove') {
        desc = '删除:' + v.id;
    }

    var record = {
        module: this.name,
        type: type,
        target: v.id,
        categoryId: v.categoryId,
        dataTypeId: v.dataTypeId,
        description: desc,
        user: user,
        targetInfo: v,
    }
    return Promise.resolve(record);
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

Model.prototype._remove = function(data, t, user) {
    var self = this;
    if (data.where) {
        data = data.where;
    }
    if (Object.keys(data).length == 0) {
        logger.warn('系统异常, 删除数据却没有传入where条件. data=' + JSON.stringify(data));
    }
    return self.orm.destroy({ where: data }, { transaction: t })
        .then(function(r) {
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

Model.prototype.addOrUpdate = function(data, t, isUnique) {
    var keyData = isUnique ? this.getUniqueKeyData(data) : this.getKeyData(data);
    var self = this;
    //console.log(keyData);
    return this.count({ where: keyData }).then(function(result) {
        if (result > 0) {
            keyData = isUnique ? self.getUniqueKeyData(data) : self.getKeyData(data);
            return self.update({ options: keyData, value: data }, t);
        } else {
            return self.add(data, t);
        }
    })
};

Model.prototype.addIfNotExist = function(data, t, isUnique) {
    var keyData = isUnique ? this.getUniqueKeyData(data) : this.getKeyData(data);
    var self = this;
    //console.log(keyData);
    return this.get(keyData, t).then(function(result) {
        if (result) {
            return Promise.resolve(result);
        } else {
            return self.add(data, t);
        }
    })
};

Model.prototype.batchAddOrUpdate = function(data, t, isUnique) {
    var self = this;
    return Promise.each(data, function(d) {
        return self.addOrUpdate(d, t, isUnique);
    })
};

Model.prototype.batchAddIfNotExist = function(data, t, isUnique) {
    var self = this;
    return Promise.each(data, function(d) {
        return self.addIfNotExist(d, t, isUnique);
    })
};

Model.prototype.getKeyData = function(data) {
    var attributes = this.attributes;
    var keyData = {};
    Object.keys(attributes).forEach(function(key) {
        var attribute = attributes[key]
        if (attribute.primaryKey) {
            keyData[key] = data[key];
        }
    });
    if (Object.keys(keyData).length == 0) {
        keyData.id = null;
    }
    return keyData;
};

Model.prototype.getUniqueKeyData = function(data) {
    var attributes = this.attributes;
    var keyData = {};
    Object.keys(attributes).forEach(function(key) {
        var attribute = attributes[key]
        if (attribute.unique) {
            keyData[key] = data[key];
        }
    });
    if (Object.keys(keyData).length == 0) {
        keyData = this.getKeyData(data);
    }
    if (Object.keys(keyData).length == 0) {
        keyData.id = null;
    }
    return keyData;
};

/**
 * 取得所有需要初始化的数据
 * @returns {Array}
 */
Model.prototype.getInitData = function() {
    return [];
};

/**
 * 是否需要 cache 表, 默认不需要
 * true - cacheMap 和 cacheList 属性保存 cache 值
 * @returns {null}
 */
Model.prototype.isCache = function() {
    return false;
}

/**
 * 取得 cache 时的主键(map 存储有效), 默认取 id 字段的值作为 key
 * @param data
 * @returns {*|boolean}
 */
Model.prototype.getCacheKey = function(data) {
    var len = this.keys.length,
        previous = '',
        self = this;
    for (var i = 0; i < len; i++) {
        previous = previous + data[self.keys[i]];
    }
    return previous;
}

Model.prototype.initData = function(t, updateForce) {
    var self = this;
    var datas = this.getInitData() || [];
    console.log(this.name + ' initData...');
    return updateForce ? self.batchAddOrUpdate(datas, t, true) : self.batchAddIfNotExist(datas, t, true)
};

/**
 * 刷新缓存的值
 * @param data
 * @param t
 * @returns {*|Promise}
 */
Model.prototype.refreshCache = function(data, t) {
    var self = this;
    if (!self.isCache()) {
        return Promise.resolve();
    }
    data = data || {};
    logger.info('刷新缓存:' + this.name);
    return self.search(data, t).then(function(r) {
        logger.info(self.name + " 缓存记录数:" + r.length);
        var list = [];
        var map = {};
        r.forEach(function(item) {
            var i = item.dataValues;
            list.push(i);
            var key = self.getCacheKey(i);
            map[key] = i;
        })
        self.cacheMap = map;
        self.cacheList = list;
        eventBus.emit('model.' + self.name + '.refreshCache');
    })
};

/**
 * 取得 cache map 值
 */
Model.prototype.getCacheMap = function() {
    return Promise.resolve(this.cacheMap || {});
}

/**
 * 取得 cache 列表
 */
Model.prototype.getCacheList = function() {
    return Promise.resolve(this.cacheList || []);
}

Model.prototype.batchAdd = function(data, t) {
    var self = this;
    var ps = data.map(function(d) {
        return self.add(d, t);
    });
    return Promise.all(ps);
};

Model.prototype.batchSqlAdd = function(data, t) {

};

Model.prototype.batchUpdate = function(data, t) {
    var self = this;
    var ps = data.map(function(d) {
        return self.update(d, t);
    });
    return Promise.all(ps);
}

Model.prototype.batchRemove = function(data, t) {
    var self = this;
    var ps = data.map(function(d) {
        return self.remove(d, t);
    });
    return Promise.all(ps);
}

Model.prototype.removeAll = function(data, t) {
    var tableName = this.name;
    return ModelManager.sequelize.query(' delete from ' + tableName);
}

Model.prototype.addAttribute = function(key, attribute) {
    addAttribute(this, key, attribute);
};

Model.prototype.findAndCountForEasyUI = function(data, t) {
    data.offset = (data.page - 1) * data.rows;
    data.limit = data.rows;

    return this.orm.findAndCount(data, t).then(function(result) {
        result.total = result.count;
        return Promise.resolve(result);
    });
};
Model.prototype.keys = ['id'];

function addAttribute(model, key, attribute) {
    var name = model.name;
    var attributes = model.attributes;
    var options = model.options;
    attributes[key] = attribute;
    model.orm = ModelManager.sequelize.define(name, attributes, options);
};

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
        //return new this.Instance(values, options);
        return oldBuild.call(orm, values, options);

    };
};

Model.prototype.removeAttribute = function(key) {
    removeAttribute(this, key);
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
    //return JSON.stringify(value);
};
Model.prototype.decode = function(value, name, values) {
    try {
        return JSON.parse(value);
    } catch (e) {
        logger.error('decode:' + name + '转换成json失败  - ' + JSON.stringify(e) + '  value=' + value, values)
    }
    return value;
};

function removeAttribute(model, key) {
    var name = model.name;
    var attributes = model.attributes;
    var options = model.options;
    delete attributes[key];
    model.orm = ModelManager.sequelize.define(name, attributes, options);
};

// Model.prototype.modifyAttribute = function(attribute){
// };

/**
 * 是否记录操作日志
 * @returns {boolean}
 */
Model.prototype.isLog = function() {
    return true;
}

Model.prototype.clone = function(json) {
    return JSON.parse(JSON.stringify(json));
}

exports.Sequelize = Sequelize;
exports.Model = Model;