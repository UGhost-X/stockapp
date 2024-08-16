let request = require("request");
const stockModel = require("../models/stockModel.js");
const logger = require("../../config/logconfig.js");

//获取最新的交易日期
let getLatestTradeDateOptions = {
  method: "GET",
  url: "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.399001&fields1=f1&fields2=f51&klt=101&fqt=1&end=20500101&lmt=1",
};
exports.getLatestTradeDate = () => {
  return new Promise((resolve, reject) => {
    request(getLatestTradeDateOptions, (error, response) => {
      if (error) {
        reject(error);
      } else {
        const data = JSON.parse(response.body);
        resolve(data.data.klines[0]);
      }
    });
  });
};

//获取所有股票当日交易数据
exports.getAllStcokDailyTradeData = () => {
  //获取全体个股当日数据
  let getAllStcokDailyTradeDataOptions = {
    method: "GET",
    url: "https://72.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=12000&po=1&np=1&fltt=2&invt=0&dect=1&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152",
  };
  return new Promise((resolve, reject) => {
    request(getAllStcokDailyTradeDataOptions, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.body);
      }
    });
  });
};

//同步每日个股数据到历史交易数据
exports.syncDailyTradeData2HistoryTradeData = async (tradeData) => {
  await stockModel.insertDailyTradeData2HistoryTradeData(tradeData);
};

//将全体个股写入数据库
exports.saveAllStcokDailyTradeData = async (latestTradeDate, data) => {
  const dataJson = JSON.parse(data);
  const diffData = dataJson.data.diff;
  try {
    stockModel.setAllStockDailyTradeData(latestTradeDate, diffData);
  } catch (error) {
    throw new Error(
      "Error Excuting saveAllStcokDailyTradeData::" + error.message
    );
  }
};

//同步每日全体个股基本数据到基本信息表
exports.syncStockBasicInfo = async () => {
  await stockModel.setAllStockBasicInfo();
};

//获取股票基本信息
exports.getAllStockBasicInfo = async () => {
  const result = await stockModel.getAllStockBasicInfo();
  return result;
};

//获取个股历史数据
exports.getStockHistoryTradeData = async (secid, startDate, endDate, lmt) => {
  secid = secid.includes(".")
    ? secid
    : secid.startsWith("0") || secid.startsWith("3")
      ? "0." + secid
      : "1." + secid;
  startDate = startDate || 0;
  endDate = endDate || 20250101;
  lmt = lmt || 12000;
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f3,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=${endDate}&beg=${startDate}&lmt=${lmt}`;
  let options = {
    method: "GET",
    url: url,
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.body);
      }
    });
  });
};

//将个股历史数据写入数据库
exports.saveStockHistoryTradeData = async (data, connection) => {
  const dataJson = JSON.parse(data);
  const klines = dataJson.data.klines;
  let stockCode = dataJson.data.code;
  const stockName = dataJson.data.name;
  stockCode =
    stockName == "创业板指" || stockName == "深证成指"
      ? "0." + stockCode
      : stockCode;
  stockCode = stockName == "上证指数" ? "1." + stockCode : stockCode;
  try {
    await stockModel.setStockHistoryTradeData(
      stockCode,
      stockName,
      klines,
      connection
    );
  } catch (error) {
    throw new Error(
      "Error Excuting saveStockHistoryTradeData::" + error.message
    );
  }
};

//获取异常个股交易状态
exports.getExceptStockState = async (code) => {
  const url = `http://gbapi.eastmoney.com/webarticlelist/api/Article/Articlelist?code=${code}`;
  let options = {
    method: "GET",
    url: url,
  };
  try {
    const data = await new Promise((resolve, reject) => {
      request(options, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.body);
        }
      });
    });
    const dataJson = JSON.parse(data);
    return dataJson.bar_info.Status;

  } catch (error) {
    throw new Error("Error Excuting getExceptStockState::" + error.message)
  }
};

//获取当日同步数据数量
exports.getDailyTradeStockAmountService = (tradeData) => {
  try {
    return stockModel.getDailyTradeStockAmount(tradeData);
  } catch (error) {
    throw new Error(
      "Error Excuting getDailyTradeStockAmountService::" + error.message
    );
  }

}