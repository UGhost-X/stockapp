const express = require("express");
const bodyParser = require("body-parser");
const stockRoutes = require("./routes/stockRoutes");
const cron = require("node-cron");
const { syncDailyStockTradeDataTask } = require("./schedulars/stockTask");
const logger = require("../config/logconfig");

// 将 logger 挂载到全局对象上
global.syncDailyTradeInfoEmailContent = "";


// 每天凌晨1点执行任务
cron.schedule("0 18 * * *", async () => {
  logger.info("启动获取所有股票交易数据任务");
  await syncDailyStockTradeDataTask();
});

const app = express();

app.use(bodyParser.json());
app.use("/", stockRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
