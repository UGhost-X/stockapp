const stockService = require("../services/scrapDataService.js");
const stockModel = require("../models/stockModel.js");
const axios = require("axios");
const pLimit = require("p-limit");

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
    let { secid } = req.query;
    secid =
      secid.startsWith("0") || secid.startsWith("3")
        ? "0." + secid
        : "1." + secid;
    const data = await stockService.getStockHistoryTradeData(secid);
    await stockService.saveStockHistoryTradeData(data);
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "get stock history trade data failed:::" + error });
  }
};

// 获取股票历史数据并保存到数据库
exports.getStockHistoryTradeDataFromDFByMultilLine = async (req, res) => {
  const connection = await stockModel.getMySqlConnection(); // 创建数据库连接
  try {
    const stockBasicInfo = await stockService.getAllStockBasicInfo(); // 传递连接
    const stockCodes = stockBasicInfo.map((row) => row.stock_code);

    const limit = pLimit(10); // 设置并发限制

    await Promise.all(
      stockCodes.map((code) =>
        limit(async () => {
          try {
            const data = await stockService.getStockHistoryTradeData(code); // 传递连接
            console.log("print log::::::", "开始下载::" + code);
            await stockService.saveStockHistoryTradeData(data, connection); // 传递连接
            console.log("print log::::::", "下载::" + code+" 完成");
          } catch (error) {
            console.error(`Error fetching data for ${code}:`, error);
          }
        })
      )
    );
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res.status(500).json({ message: "get stock history trade data failed" });
  } finally {
    connection.commit();
    connection.end(); // 确保在所有操作完成后关闭连接
  }
};

exports.syncStockBasicInfoFromDailyTradeData = async (req, res) => {
  try {
    await stockService.syncStockBasicInfo();
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res.status(500).json({ message: "get stock history trade data failed" });
  }
};
