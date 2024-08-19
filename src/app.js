const express = require("express");
const bodyParser = require("body-parser");
const stockRoutes = require("./routes/stockRoutes");
const logger = require("../config/logconfig");
const cron = require("node-cron");
const stockTask = require('./schedulars/stockTask')


global.syncDailyTradeInfoEmailContent = "";


exports.syncDailyStockTradeDataSchedular = async () => {
  logger.info("syncDailyStockTradeDataSchedular had registed")
  cron.schedule("31 17 * * *", async () => {
    logger.info("Get All Stocks Data Task Starting....");
    await stockTask.syncDailyStockTradeDataTask();
  });
}

const app = express();
app.use(bodyParser.json());
app.use("/", stockRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
