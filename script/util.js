var mysql = require('mysql'),
    SqlString = mysql.SqlString,
    config = require('./config'),
    pool = exports.pool = mysql.createPool(config.db_config);

exports.isGeneratorFunction = function (generator) {
    // if(generator && generator.constructor){
    //    console.log(generator.constructor.name,generator.constructor.displayName);
    // }
    return generator && generator.constructor && (generator.constructor.name === 'GeneratorFunction' || generator.constructor.displayName === 'GeneratorFunction');
    // return generator && generator.prototype.next && generator.prototype.throw;

}

var query = function (context, generator, next, con, options) {
    var iterator = generator.call(context, function (err, value) {
        setImmediate(function () {
            try {
                if (err) {
                    iterator.throw(err);
                } else {
                    iterator.next(value).done && next && next(null, value);
                }
            } catch (e) {
                next && next(e);
            }
        });
    }, con, options);
    iterator.next();
};

exports.query = query;

var crypto = require('crypto'),
    len = 128,
    iterations = 12000;

/**
 * Hashes a password with optional `salt`, otherwise
 * generate a salt for `pass` and invoke `fn(err, salt, hash)`.
 *
 * @param {String} password to hash
 * @param {String} optional salt
 * @param {Function} callback
 * @api public
 */
exports.hash = function (pwd, salt, fn) {
    pwd = pwd || '';
    // console.log(pwd);
    var async = false, digest = 'SHA1';
    if (3 == arguments.length) {
        if(!(typeof fn === 'function') && fn === true){
          async = true;
        }
        if(async){
           return {salt:salt,hash:crypto.pbkdf2Sync(pwd,salt,1024,len,digest).toString('base64')};  
        }else{
           crypto.pbkdf2(pwd, salt, iterations, len,digest, function (err, hash) {
              fn(err, hash.toString('base64'));
           }); 
        }
    } else {
        fn = salt;
        if(!(typeof fn === 'function') && fn === true){
          async = true;
        }
        if(async){
             salt = crypto.randomBytes(len);
             salt = salt.toString('base64');
             return {salt:salt,hash:crypto.pbkdf2Sync(pwd,salt,1024,len,digest).toString('base64')};  
        }else{
            crypto.randomBytes(len, function (err, salt) {
                if (err) {
                    return fn(err);
                }
                salt = salt.toString('base64').toString('base64');  
                crypto.pbkdf2(pwd, salt, iterations, len,digest, function (err, hash) {
                    if (err) {
                        return fn(err);
                    }
                    fn(null, {salt: salt, hash: hash.toString('base64')});
                });
            });
        }
    }
};


var extend = exports.extend = function (dest, src) {
    for (var name in src) {
        dest[name] = src[name];
    }
    return dest;
};

exports.getLog = function (req) {
    return {
        date: new Date(),
        username: req.session.username,
        module: req.params.module,
        method: req.params.method,
        ip: req.ip,
        session_id: req.sessionID,
        user_agent: req.headers['user-agent']
    };
};

exports.addLog = function (log) {
    if (!config.log) {
        return;
    }
    var sql = 'INSERT `_log` SET `time`=?',
        args = [new Date().getTime() - log.date.getTime()];
    Object.keys(log).forEach(function (key) {
        sql += ',??=?';
        args.push(key, log[key]);
    });
    pool.getConnection(function (error, connection) {
        connection && connection.query(sql, args, function (error, value) {
            connection.release();
        });
    });
};

exports.parse = function (text) {
    if (typeof text === 'object') {
        return text;
    } else {
        try {
            return JSON.parse(text);
        } catch (e) {
            return {};
        }
    }
};

exports.getDate = function (date, start) {
    date = Date.parse(date);
    if (isNaN(date)) {
        return null;
    } else {
        date = new Date(date);
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + (start ? ' 00:00:00' : ' 23:59:59');
    }
};

exports.endConnection = function () {
    pool.end();
};

exports.extend = function(subClass,superClass){
    if (superClass) {
        var F = function() {
        };
        F.prototype = superClass.prototype;
        subClass.prototype = new F();
        subClass.prototype.constructor = subClass;

        subClass.superClass = superClass.prototype;
        if (superClass.prototype.constructor == Object.prototype.constructor) {
            superClass.prototype.constructor = superClass;
        }

    }
};
exports.isArray = function(o){
    return this.is(o, 'Array');
}
exports.isObject = function(o){
    return this.is(o, 'Object');
}
exports.is = function(o, obj) {
    return Object.prototype.toString.call(o) === '[object ' + obj + ']';
}
var customTable = {};
exports.setCustomTable= function(category, table){
    customTable[category] = table;
}
exports.getCustomTable = function(category){
    return customTable[category];
}
exports.getCustomTables = function () {
    return customTable;
}

var timerIdMap = {};
exports.runDelayTask = function(id, delay, task){
    if(timerIdMap[id]){
        clearTimeout(timerIdMap[id]);
    }
    timerIdMap[id] = setTimeout(function(){
        timerIdMap[id] = null;
        task && task()
    }, delay);
}

