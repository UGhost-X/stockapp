const app = require('./app.js');
const dotenv = require("dotenv");

//注册同步任务
app.syncDailyStockTradeDataSchedular();
app.calcHistoryMinCloseSchedular();
const envFile = `.env.${process.env.NODE_ENV}`; // 获取当前环境对应的 .env 文件名
dotenv.config({ path: envFile }); // 加载指定的 .env 文件



