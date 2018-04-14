var Model = require('./Model');
var co = require('co');
Model = Model.Model;
var ModelManager = require('./ModelManager');
var Promise = require('bluebird');
var Sequelize = require("sequelize");
var util = require('../util');
var name = "data";
var attributes = {
    ii: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        hidden: true
    },
    id: {
        type: Sequelize.STRING,
        // primaryKey: true,
        unique: true,
        allowNull: false,
        searchable: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        searchable: true,
        defaultValue: ''
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
        searchable: true
    },
    position: {
        type: Sequelize.STRING,
        allowNull: true,
        json: true,
    },
    position2d: {
        type: Sequelize.STRING,
        allowNull: true,
        json: true,
    },
    rotation: {
        type: Sequelize.STRING,
        allowNull: true,
        json: true,
    },
    location: {
        type: Sequelize.STRING,
        allowNull: true,
        json: true,
    },
    parentId: {
        type: Sequelize.STRING,
        allowNull: true,
        searchable: true
    },
    dataTypeId: {
        type: Sequelize.STRING,
        searchable: true,
        ref: 'datatype'
    },
    businessTypeId: {
        type: Sequelize.STRING,
        searchable: true,
        ref: 'business_type'
    },
    weight: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    extend: {
        type: Sequelize.STRING,
        json: true,
    },
};
var element = {
    showCheckBox: true,
    showCopyBtn: true

}

var Data = function() {
    Model.call(this, name, attributes, null, "数据", element);
};
util.extend(Data, Model);

Data.prototype.keys = ['ii'];

/**
 * 添加资产需要引入License验证
 * 同时需要更新缓存的机柜数量等
 */
Data.prototype.add = function(param,t){
    var self = this;

    var dataTypeId = param.dataTypeId;
    console.log(param);
    return Model.prototype.add.call(self,param,t);
    // var datatypeModel = ModelManager.getModel('datatype');
    // return datatypeModel.get({id:dataTypeId}).then(function(datatype){
    //     if(datatype == null){
    //         return Promise.reject("DataType '" + dataTypeId + "' dose not exist");
    //     }
    //     datatype = datatype.dataValues;
    //     var categoryId = datatype.categoryId;
    //     var count = global["count." + categoryId],licenseCount = global["licenseCount." + categoryId] ;
    //     if(count != null && licenseCount !=null){
    //           if(count +1 > licenseCount){
    //             return Promise.reject("License error : count for '" + categoryId + "' " + (count+1)+" > license count " + licenseCount);
    //           }
    //     }
    //     cron.ql();
    //     return Model.prototype.add.call(self,param,t);
    // });
};
/**
 * 重新缓存机柜等数量,需要调用cron.ql方法。
 */
Data.prototype.remove = function (param,t) {
    var self = this;
    cron.ql();
    var dataOutbound = ModelManager.getModel('data_outbound');
    // console.log(param);
    return self.get(param).then(function(cdata){
        var dataValues = cdata.dataValues;
        // console.log(dataValues);
        return dataValues;
    }).then(function(dataValues){
        // console.log(dataValues);
        return Model.prototype.remove.call(self,param,t).then(function(){
            // console.log(dataValues);
            return dataOutbound.add(dataValues,t);
        });
    })
};

Data.prototype.searchAndCount = function(param, t) {
    var self = this;
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
        if (data.offset) {
            data.offset = parseInt(data.offset);
        }
        if (data.limit) {
            data.limit = parseInt(data.limit);
        }
    }
    //如果传入的categoryId,没有传入dataTypeId,说明要按类型查找
    if (data.where && data.where.categoryId && !data.where.dataTypeId) {
        var categoryId = data.where.categoryId;
        delete data.where['categoryId'];
        var sql = "select dt.id as id from datatype as dt where dt.category_id = ?";
        return ModelManager.sequelize.query(sql, {replacements: [categoryId],  type: ModelManager.sequelize.QueryTypes.SELECT })
            .then(function(dts) {
                var ids = dts.map(function(dt) {
                    return dt.id;
                })
                data.where.dataTypeId = { "$in": ids };
                return self.orm.findAndCountAll(data, t);
            });
    } else {
        if (data.where && data.where.categoryId) {
            delete data.where['categoryId'];
        }
        return this.orm.findAndCountAll(data, t);
    }
};

Data.prototype.getKeyData = function(data) {

    if (data.ii !== undefined) {
        return { ii: data.ii };
    } else if (data.id !== undefined) {
        return { id: data.id };
    }
    return { id: null };
};

exports.Model = Data;