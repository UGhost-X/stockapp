const express = require("express");
const bodyParser = require("body-parser");
const stockRoutes = require("./routes/stockRoutes");
const logger = require("../config/logconfig");
const cron = require("node-cron");
const stockTask = require('./schedulars/stockTask')


global.syncDailyTradeInfoEmailContent = "";


let isScheduled = false; // 标记定时任务是否已经被注册
function syncDailyStockTradeDataSchedular() {
  if (!isScheduled) {
    cron.schedule("0 18 * * *", async () => {
      logger.info("启动获取所有股票交易数据任务");
      await stockTask.syncDailyStockTradeDataTask();
    });
    isScheduled = true; // 标记定时任务已经注册
  }
}

// 调用此函数来注册定时任务
syncDailyStockTradeDataSchedular();



const app = express();

app.use(bodyParser.json());
app.use("/", stockRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
