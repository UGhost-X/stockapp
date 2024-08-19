const stockService = require("../services/scrapDataService");
const sendMailService = require("../services/mailSMTPService");
const logger = require("../../config/logconfig");
const moment = require('moment');


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



exports.syncDailyStockTradeDataTask = async () => {
  try {
    const latestTradeDate = await stockService.getLatestTradeDate();
    logger.info(latestTradeDate);
    const data = await stockService.getAllStcokDailyTradeData();
    await stockService.saveAllStcokDailyTradeData(latestTradeDate, data);
    logger.info("所有个股当日交易数据已下载");
    await sleep(1000 * 30);
    await stockService.syncDailyTradeData2HistoryTradeData(latestTradeDate);
    logger.info("所有个股当日交易数据已同步至历史交易数据");
    await sleep(1000 * 30);
    await stockService.syncStockBasicInfo();
    logger.info("所有个股基本信息已经同步完成");

    // 获取当前日期
    const currentDate = new Date();
    // 格式化当前日期
    const formattedTimestamp = moment(latestTradeDate).format("YYYY-MM-DD");
    logger.info(formattedTimestamp);
    const syncAmount = await stockService.getDailyTradeStockAmountService(formattedTimestamp);

    await sendMailService.sendMailService(
      formattedTimestamp + " 股票数据同步情况",
      "所有数据已经同步完成,同步数据量::"+syncAmount[0].amount
    );
    logger.info(formattedTimestamp+" 同步情况邮件已发送")
  } catch (error) {
    await sendMailService.sendMailService(
      formattedTimestamp + " 股票数据同步情况",
      "数据同步数据失败::" + error.message
    );
    logger.error("获取并保存所有股票交易数据失败", error);
  }
};
