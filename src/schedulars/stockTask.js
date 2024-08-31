const stockService = require("../services/scrapDataService");
const sendMailService = require("../services/mailSMTPService");
const stockModel = require("../models/stockModel.js");
const stockAnalysis = require("../services/stockAnalysis");
const logger = require("../../config/logconfig");
const moment = require('moment');


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// 定义超时时间
const TIMEOUT = 1000*60*5; // 5分钟

// 创建一个带超时功能的Promise
function withTimeout(promise, timeout) {
  let timer;
  const rejectWithTimeout = () => {
    clearTimeout(timer);
    return Promise.reject(new Error('Operation timed out'));
  };
  return new Promise((resolve, reject) => {
    timer = setTimeout(rejectWithTimeout, timeout);
    promise.then(resolve, reject);
  }).finally(() => clearTimeout(timer));
}

exports.syncDailyStockTradeDataTask = async (stockService, logger, sendMailService) => {
  try {
    const latestTradeDate = await stockService.getLatestTradeDate();
    const latestDate = moment(latestTradeDate).format("YYYY-MM-DD");

    if (moment().isAfter(latestDate, 'day')) {
      logger.info("当前非交易日或非交易时间");
      return null;
    }

    // 获取所有股票的当日交易数据并保存
    const data = await withTimeout(stockService.getAllStcokDailyTradeData(), TIMEOUT);
    await withTimeout(stockService.saveAllStcokDailyTradeData(latestTradeDate, data), TIMEOUT);
    logger.info("所有个股当日交易数据已下载");

    // 等待30秒
    await sleep(1000 * 30);

    // 同步当日交易数据到历史交易数据
    await withTimeout(stockService.syncDailyTradeData2HistoryTradeData(latestTradeDate), TIMEOUT);
    logger.info("所有个股当日交易数据已同步至历史交易数据");

    // 更新三个主板的数据
    const connection = await stockService.getMySqlConnection();
    const mainPanelCodes = ['1.000001', '0.399006', '0.399001'];
    for (const code of mainPanelCodes) {
      let data = await withTimeout(stockService.getStockHistoryTradeData(code, latestDate, '20500101', 1), TIMEOUT);
      await withTimeout(stockService.saveStockHistoryTradeData(data, connection), TIMEOUT);
    }
    logger.info("主板数据已更新....");

    // 同步股票基本信息
    await withTimeout(stockService.syncStockBasicInfo(), TIMEOUT);
    logger.info("所有个股基本信息已经同步完成");

    // 开始数据的分析
    const historyStartDate = moment(latestDate).subtract(24, 'months').format("YYYY-MM-DD");
    const dataGrouped = await withTimeout(stockAnalysis.getHistoryTradeDataService(historyStartDate, latestDate), TIMEOUT);
    logger.info("获取数据已完成...");

    // 分析数据
    await withTimeout(stockAnalysis.volumeEnergyService(dataGrouped, 0), TIMEOUT);
    logger.info("数据分析已完成...");

    // 预警数据分析
    await withTimeout(stockAnalysis.stockWarningService(dataGrouped), TIMEOUT);
    logger.info("预警数据分析已完成...");

    // 更新一个月内的分析数据
    await withTimeout(stockService.updateStockAnalyseOneMonthService(latestDate), TIMEOUT);
    logger.info("更新分析数据跟踪情况已经完成");

    // 获取分析数据列表
    const dataAnalyseList1 = await withTimeout(stockService.getAnalyseStockListService(latestDate), TIMEOUT);
    const dataAnalyseList2 = await withTimeout(stockService.getLatestMonthAnalyseSituationService(latestDate), TIMEOUT);
    logger.info("获取分析数据列表已完成...");

    // 构建邮件内容
    let tableHtml1 = sendMailService.getAnalyseTableTemplete(dataAnalyseList1.headers, dataAnalyseList1.rows, `${latestDate} 数据分析情况`);
    let tableHtml2 = sendMailService.getAnalyseTableTemplete(dataAnalyseList2.headers, dataAnalyseList2.rows, `${latestDate} 前数据分析跟踪情况`);
    let tableHtml = tableHtml1 + tableHtml2;

    if (dataAnalyseList1.rows.length === 0) {
      tableHtml = `
        <h3> 所有数据已经同步完成,同步数据量:: ${syncAmount[0].amount},今日无筛选结果 </h3>
      `;
    }

    // 发送邮件
    const syncAmount = await withTimeout(stockService.getDailyTradeStockAmountService(latestDate), TIMEOUT);
    await withTimeout(sendMailService.sendMailService(
      `${latestDate} 股票数据情况`,
      `所有数据已经同步完成,同步数据量::${syncAmount[0].amount}`, 
      tableHtml
    ), TIMEOUT);

    logger.info(`${latestDate} 股票数据情况已发送`);

  } catch (error) {
    logger.error(`获取并保存所有股票交易数据失败:`, error);
    await sendMailService.sendMailService(
      `${latestDate} 股票数据同步情况`,
      `数据同步数据失败::${error.message}`
    );
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

exports.calcHistoryDailyMinCloseTask = async (stockService, logger) => {
  try {
    await withTimeout(stockService.calcStockWarningHistoryMinService(), TIMEOUT);
    logger.info("计算历史最低值过程已完成");
  } catch (error) {
    logger.error("计算历史最低值过程失败:::", error);
  }
};