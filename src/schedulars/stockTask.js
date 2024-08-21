const stockService = require("../services/scrapDataService");
const sendMailService = require("../services/mailSMTPService");
const stockAnalysis = require("../services/stockAnalysis");
const logger = require("../../config/logconfig");
const moment = require('moment');


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



exports.syncDailyStockTradeDataTask = async () => {
  try {
    const latestTradeDate = await stockService.getLatestTradeDate();
    const dateNow = moment(Date.now()).format("YYYY-MM-DD");
    const latestDate = moment(latestTradeDate).format("YYYY-MM-DD");
    if (dateNow.isAfter(latestDate)) {
      logger.info("当前非交易日或非交易时间");
      return null;
    }
    const data = await stockService.getAllStcokDailyTradeData();
    await stockService.saveAllStcokDailyTradeData(latestTradeDate, data);
    logger.info("所有个股当日交易数据已下载");
    await sleep(1000 * 30);
    await stockService.syncDailyTradeData2HistoryTradeData(latestTradeDate);
    logger.info("所有个股当日交易数据已同步至历史交易数据");
    await sleep(1000 * 30);
    await stockService.syncStockBasicInfo();
    logger.info("所有个股基本信息已经同步完成");
    logger.info("数据开始分析.......");
    const historyStartDate = moment(latestTradeDate).subtract(18, 'months').format("YYYY-MM-DD");
    const dataGrouped = await stockAnalysis.getHistoryTradeDataService(historyStartDate,latestDate);
    logger.info("获取数据已完成...");
    await stockAnalysis.volumeEnergyService(dataGrouped, 0);
    logger.info("数据分析已完成...");
    const dataAnalyseList = await stockService.getAnalyseStockListService(latestDate);
    logger.info("获取分析数据列表已完成...");
    let tableHtml = sendMailService.getAnalyseTableTemplete(dataAnalyseList.headers, dataAnalyseList.rows,latestDate+" 数据分析情况");
    const syncAmount = await stockService.getDailyTradeStockAmountService(latestDate);
    if(dataAnalyseList.rows.length===0){
      tableHtml = `
        <h3> 所有数据已经同步完成,同步数据量:: ${syncAmount[0].amount},今日无筛选结果 </h3>
      `
    }
    await sendMailService.sendMailService(
      latestDate + " 股票数据情况",
      "所有数据已经同步完成,同步数据量::" + syncAmount[0].amount, tableHtml
    );
    logger.info(latestDate + " 股票数据情况已发送")
  } catch (error) {
    await sendMailService.sendMailService(
      latestDate + " 股票数据同步情况",
      "数据同步数据失败::" + error.message
    );
    logger.error("获取并保存所有股票交易数据失败", error);
  }
};
