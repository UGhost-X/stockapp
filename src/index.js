require('./app.js');
const dotenv = require("dotenv");

const envFile = `.env.${process.env.NODE_ENV}`; // 获取当前环境对应的 .env 文件名
dotenv.config({ path: envFile }); // 加载指定的 .env 文件