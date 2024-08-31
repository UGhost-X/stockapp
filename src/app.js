const express = require("express");
const bodyParser = require("body-parser");
const stockRoutes = require("./routes/stockRoutes");
const logger = require("../config/logconfig");
const cron = require("node-cron");
const stockTask = require('./schedulars/stockTask')
const stockService = require("./services/scrapDataService");
const sendMailService = require("./services/mailSMTPService");
const stockModel = require("./models/stockModel");
const cors = require('cors');

global.syncDailyTradeInfoEmailContent = "";


exports.syncDailyStockTradeDataSchedular = async () => {
  logger.info("syncDailyStockTradeDataSchedular had registed")
  cron.schedule("30 23 * * *", async () => {
    logger.info("Get All Stocks Data Task Starting....");
    await stockTask.syncDailyStockTradeDataTask(stockService, stockModel, logger, sendMailService);
  });
}

exports.calcHistoryMinCloseSchedular = async () => {
  logger.info("calcHistoryMinCloseSchedular had registed")
  cron.schedule("30 18 * * *", async () => {
    logger.info("Calc History Min Close Task Starting....");
    await stockTask.calcHistoryDailyMinCloseTask(stockService, logger);
  });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/", stockRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
