module.exports = {
    panoFolderName: 'public/theme/panoramic',
    index: '/api',
    api: '/api/monitor',
	adminApi: '/api/admin',
    tool:'/clear/data',
    logins: true,
    port: 3000,
    secret: '39857DFLKJSFLJ3^%$sfL!',
    db_config: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        // database: 'itv_new_theme', 
        // database: 'itv_fjgd',
        database: 'itv_per_test',
        // database: 'itv_gxx', 
        // database: 'itv_gztb', 
        // database: 'itv_store',
        // database: 'itv_szsmr',
        tableCharset: 'utf-8',   
        debug: ['ComQueryPacket'],
        pool: {
            max: 1000,
            min: 0,
            idle: 10000
        },
    },
    show_sql:true,
    syncForce: true,
};