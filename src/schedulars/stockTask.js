const moment = require('moment');
const stockAnalysis = require("../services/stockAnalysis");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 定义超时时间
const TIMEOUT = 1000 * 60 * 30; // 30分钟

// 重试机制
const retry = async (fn, retries = 3, interval = 1000 * 30) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retrying ${fn.name} (${i + 1}/${retries})...`);
        await sleep(interval);
      } else {
        throw error;
      }
    }
  }
};

// 创建一个带超时功能的Promise
const withTimeout = async (promise, timeout) => {
  let timer;
  const rejectWithTimeout = () => {
    clearTimeout(timer);
    return Promise.reject(new Error('Operation timed out'));
  };

  try {
    // 使用 Promise.race 来实现超时
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(rejectWithTimeout, timeout);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
};

exports.syncDailyStockTradeDataTask = async (stockService, stockModel, logger, sendMailService, stockAnalysis) => {
  if (!stockService || !stockModel || !logger || !sendMailService || !stockAnalysis) {
    throw new Error("Missing required parameters");
  }
  let connection;
  const latestTradeDate = await retry(() => stockService.getLatestTradeDate());
  const latestDate = moment(latestTradeDate).format("YYYY-MM-DD");

  try {
    if (moment().isAfter(latestDate, 'day')) {
      logger.info("当前非交易日或非交易时间");
      return null;
    }
    // 尝试获取指定日期的运行状态
    const result = await retry(() => withTimeout(stockModel.getStockRunningStatus(latestTradeDate), TIMEOUT));

    if (result.length === 0) {
      // 如果没有找到记录，则插入一条新记录
      logger.info(`No running status found for date ${latestTradeDate}, inserting a new record.`);
      await retry(() => withTimeout(stockModel.setStockRunningStatus(latestDate, 0), TIMEOUT));
    } else {
      const runningStatus = result[0].running_status;
      logger.info(`Current running status: ${runningStatus}`);
      if (runningStatus === 1) {
        logger.info("今日任务已完成");
        return null;
      }
    }
    // 获取所有股票的当日交易数据并保存
    const data = await retry(() => withTimeout(stockService.getAllStcokDailyTradeData(), TIMEOUT));
    await retry(() => withTimeout(stockService.saveAllStcokDailyTradeData(latestTradeDate, data), TIMEOUT));
    logger.info("所有个股当日交易数据已下载");

    // 等待30秒
    await sleep(1000 * 30);

    // 同步当日交易数据到历史交易数据
    await retry(() => withTimeout(stockService.syncDailyTradeData2HistoryTradeData(latestTradeDate), TIMEOUT));
    logger.info("所有个股当日交易数据已同步至历史交易数据");

    // 更新三个主板的数据
    connection = await retry(() => stockModel.getMySqlConnection());
    const mainPanelCodes = ['1.000001', '0.399006', '0.399001'];
    for (const code of mainPanelCodes) {
      let data = await retry(() => withTimeout(stockService.getStockHistoryTradeData(code, latestDate, '20500101', 1), TIMEOUT));
      await retry(() => withTimeout(stockService.saveStockHistoryTradeData(data, connection), TIMEOUT));
    }
    logger.info("主板数据已更新....");

    // 同步股票基本信息
    await retry(() => withTimeout(stockService.syncStockBasicInfo(), TIMEOUT));
    logger.info("所有个股基本信息已经同步完成");

    // 开始数据的分析
    const historyStartDate = moment(latestDate).subtract(24, 'months').format("YYYY-MM-DD");
    const dataGrouped = await retry(() => withTimeout(stockAnalysis.getHistoryTradeDataService(historyStartDate, latestDate), TIMEOUT));
    logger.info("获取数据已完成...");

    // 分析数据
    await retry(() => withTimeout(stockAnalysis.volumeEnergyService(dataGrouped, 0), TIMEOUT));
    logger.info("数据分析已完成...");

    // 预警数据分析
    await retry(() => withTimeout(stockAnalysis.stockWarningService(dataGrouped), TIMEOUT));
    logger.info("预警数据分析已完成...");

    // 更新一个月内的分析数据
    await retry(() => withTimeout(stockService.updateStockAnalyseOneMonthService(latestDate), TIMEOUT));
    logger.info("更新分析数据跟踪情况已经完成");

    // 获取分析数据列表
    const dataAnalyseList1 = await retry(() => stockService.getAnalyseStockListService('volumnEnerge',latestDate));
    const dataAnalyseList2 = await retry(() => stockService.getLatestMonthAnalyseSituationService(latestDate));
    logger.info("获取分析数据列表已完成...");

    // 构建邮件内容
    let tableHtml1 = await retry(() => withTimeout(sendMailService.getAnalyseTableTemplete(dataAnalyseList1.headers, dataAnalyseList1.rows, `${latestDate} 数据分析情况`), TIMEOUT));
    let tableHtml2 = await retry(() => withTimeout(sendMailService.getAnalyseTableTemplete(dataAnalyseList2.headers, dataAnalyseList2.rows, `${latestDate} 前数据分析跟踪情况`), TIMEOUT));
    let tableHtml = tableHtml1 + tableHtml2;

    // 发送邮件
    const syncAmount = await retry(() => withTimeout(stockService.getDailyTradeStockAmountService(latestDate), TIMEOUT));

    logger.info(dataAnalyseList1.rows)

    if (dataAnalyseList1.rows.length === 0) {
      tableHtml = `
          <h3> 所有数据已经同步完成,同步数据量:: ${syncAmount[0].amount},今日无筛选结果 </h3>
        `+ tableHtml2;
    }
    // await retry(() => withTimeout(sendMailService.sendMailService(
    //   `${latestDate} 股票数据情况`,
    //   `所有数据已经同步完成,同步数据量::${syncAmount[0].amount}`,
    //   tableHtml
    // ), TIMEOUT));

    // logger.info(`${latestDate} 股票数据情况已发送`);
    // await retry(() => withTimeout(stockModel.setStockRunningStatus(latestDate, 1), TIMEOUT));

  } catch (error) {
    logger.error(`获取并保存所有股票交易数据失败:`, error.message);
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
  const MAX_RETRIES = 2; // 最多重试次数
  let retries = 0;
  const latestTradeDate = await stockService.getLatestTradeDate();
  while (retries <= MAX_RETRIES) {
    try {
      await withTimeout(stockService.calcStockWarningHistoryMinService(), TIMEOUT);
      logger.info("计算历史最低值过程已完成");
      await withTimeout(stockAnalysis.calcDailyUpDownCountService(latestTradeDate), TIMEOUT);
      logger.info("计算每日涨跌数已完成");
      break; // 成功后退出循环
    } catch (error) {
      if (retries === MAX_RETRIES) {
        logger.error("计算历史最低值过程失败:::", error);
        break; // 最多重试次数后退出循环
      }
      retries++;
      logger.warn(`计算历史最低值过程失败，正在进行第${retries + 1}次重试`);
      sleep(1000 * 120)
    }
  }
};

exports.calc169DayRevertTask = async (stockService, stockAnalysis, logger) => {
  logger.info("begining...")
  const latestTradeDate = await retry(() => stockService.getLatestTradeDate());
  const latestDate = moment(latestTradeDate).format("YYYY-MM-DD");
  // 开始数据的分析
  const historyStartDate = moment(latestDate).subtract(30, 'months').format("YYYY-MM-DD");
  const dataGrouped = await retry(() => withTimeout(stockAnalysis.getHistoryTradeDataService(historyStartDate, latestDate), TIMEOUT));
  logger.info("获取数据已完成...");

  // 分析数据
  await retry(() => withTimeout(stockAnalysis.ma169RevertService(dataGrouped, 80), TIMEOUT));
  logger.info("169日反弹法数据分析已完成...");

}