const stockService = require("../services/scrapDataService");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

exports.syncDailyStockTradeDataTask = async () => {
  try {
    const latestTradeDate = await stockService.getLastestTradeDate();
    const data = await stockService.getAllStcokDailyTradeData();
    await stockService.saveAllStcokDailyTradeData(latestTradeDate, data);
    global.logger.info("所有个股当日交易数据已下载")
    await sleep(1000*30)
    await stockService.syncDailyTradeData2HistoryTradeData(latestTradeDate);
    global.logger.info("所有个股当日交易数据已同步至历史交易数据")
    await sleep(1000*30)
    await stockService.syncStockBasicInfo();
    global.logger.info("所有个股个股基本信息已经同步完成")
  } catch (error) {
    console.error("获取并保存所有股票交易数据失败", error);
  }
};
