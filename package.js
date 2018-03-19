package = {  
    //项目名称  
    "name": "demo",
    //版本号（遵守“主版本.次要版本.补丁号”的格式  
    "version": "1.0.0",  
    //description描述你的模块,或者搜索  
    "description": "express",  
    //main字段指定了加载的入口文件，即主文件  
    "main": "app.js",  
    // scripts指定了运行脚本命令的npm命令行缩写，比如start指定了运行npm start时，所要执行的命令。  
    "scripts": {  
      "start": "node index.js"  
    },  
    //repository(仓库)指定一个代码存放地址  
    "repository": {  
      "type": "git",  
      "url": "git+https://github.com/XXXX"  
    },  
    //作者  
    "author": "mayuan",  
    //授权方式  
    "license": "MIT",  
    //指明node.js运行所需要的版本  
    "engines": {  
        "node": "0.10.x"  
    },  
    "bugs": {  
        "url": "https://github.com/XXXX"  
    },  
    // 一个字符串数组，方便别人搜索到本模块  
    "keywords": [  
    "vue","iview"  
    ],   
    //devDependencies指定项目开发所需要的模块  
    "devDependencies": {  
        "babel-core": "^6.23.1",  
        "babel-loader": "^6.3.2",  
        "babel-preset-es2015": "^6.22.0",  
        "vue-html-loader": "^1.0.0",  
        "vue-loader": "^8.5.2",  
        "vue-style-loader": "^1.0.0",  
        "webpack": "^1.13.2"  
    },  
    //dependencies字段指定了项目运行所依赖的模块  
    "dependencies": {  
        "express": "latest", //指定express是最新版本  
        "mongoose": "~3.8.3",  
        "handlebars-runtime": "~1.0.12"
    }
}