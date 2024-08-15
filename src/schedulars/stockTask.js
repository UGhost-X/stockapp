const stockService = require("../services/scrapDataService");
const sendMailService = require("../services/mailSMTPService");
const logger = require("../../config/logconfig");


function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份是从0开始的，所以需要加1
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.syncDailyStockTradeDataTask = async () => {
  try {
    const latestTradeDate = await stockService.getLastestTradeDate();
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
    const formattedTimestamp = formatTimestamp(currentDate);

    const sysncStockAmount = stockService.getDailyTradeStockAmountService(latestTradeDate)

    await sendMailService.sendMailService(
      formattedTimestamp + " 股票数据同步情况",
      "所有数据已经同步完成,同步数据量:"+sysncStockAmount
    );
  } catch (error) {
    await sendMailService.sendMailService(
      formattedTimestamp + " 股票数据同步情况",
      "数据同步数据失败::" + error.message
    );
    logger.error("获取并保存所有股票交易数据失败", error);
  }
};
