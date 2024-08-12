const stockService = require("../services/scrapDataService.js");
const stockModel = require("../models/stockModel.js");
const pLimit = require("p-limit");
const logger = require("../../config/logconfig");


//获取所有股票当日交易数据
exports.getAllStockDailyTradeDataFromDF = async (req, res) => {
  try {
    const latestTradeDate = await stockService.getLastestTradeDate();
    const data = await stockService.getAllStcokDailyTradeData();
    stockService.saveAllStcokDailyTradeData(latestTradeDate, data);
    res.status(200).json({ message: "get all stock trade data success" });
  } catch (error) {
    res.status(500).json({ message: "get all stock trade data failed" });
  }
};

//根据提供的股票代码获取数据
exports.getStockHistoryTradeDataFromDF = async (req, res) => {
  try {
    let { secid, startDate, endData, lmt } = req.query;
    secid =
      secid.startsWith("0") || secid.startsWith("3")
        ? "0." + secid
        : "1." + secid;
    const data = await stockService.getStockHistoryTradeData(
      secid,
      startDate,
      endData,
      lmt
    );
    const connection = await stockModel.getMySqlConnection(); // 创建数据库连接
    await stockService.saveStockHistoryTradeData(data, connection);
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "get stock history trade data failed:::" + error });
  } finally {
    connection.end();
  }
};

// 获取股票历史数据并保存到数据库
exports.getStockHistoryTradeDataFromDFByMultilLine = async (req, res) => {
  let { startDate, endData, lmt } = req.query;
  const connection = await stockModel.getMySqlConnection(); // 创建数据库连接
  try {
    const stockBasicInfo = await stockService.getAllStockBasicInfo(); // 传递连接
    const stockCodes = stockBasicInfo.map((row) => row.stock_code);

    const limit = pLimit(10); // 设置并发限制

    await Promise.all(
      stockCodes.map((code) =>
        limit(async () => {
          try {
            const data = await stockService.getStockHistoryTradeData(
              code,
              startDate,
              endData,
              lmt
            ); // 传递连接
            await stockService.saveStockHistoryTradeData(data, connection); // 传递连接
          } catch (error) {
            // 在每次追加前添加一个换行符
            global.syncDailyTradeInfoEmailContent += `\nError fetching data for ${code}`;

            // 如果您希望在第一次追加时不出现换行符，您可以检查当前的内容是否为空
            if (global.syncDailyTradeInfoEmailContent === "") {
              global.syncDailyTradeInfoEmailContent += `Error fetching data for ${code}`;
            } else {
              global.syncDailyTradeInfoEmailContent += `\nError fetching data for ${code}`;
            }

            logger.error(
              `Error fetching data for ${code}:`,
              error.message
            );
          }
        })
      )
    );
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res.status(500).json({ message: "get stock history trade data failed" });
  } finally {
    logger.info("########----  数据已经下载完成  ----#####");
    connection.commit();
    connection.end(); // 确保在所有操作完成后关闭连接
  }
};

//从每日交易数据同步数据至基础信息表
exports.syncStockBasicInfoFromDailyTradeData = async (req, res) => {
  try {
    await stockService.syncStockBasicInfo();
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res.status(500).json({
      message: "get stock history trade data failed::" + error.message,
    });
  }
};

//获取个股交易状态
exports.getExceptStockStateFromDF = async (req, res) => {
  const { stockCode } = req.query;
  try {
    const stock_trade_status = await stockService.getExceptStockState(
      stockCode
    );
    logger.info("get stock trade status success::" + stock_trade_status);
    res.status(200).json({
      message: "get stock trade status success::" + stock_trade_status,
    });
  } catch (error) {
    logger.error(
      "get stock trade status success::" + stock_trade_status
    );
    res.status(500).json({
      message: "get stock trade status failed::" + error.message,
    });
  }
};
