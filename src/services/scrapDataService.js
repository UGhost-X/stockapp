const axios = require("axios")
const stockModel = require("../models/stockModel.js");
const logger = require("../../config/logconfig.js");

//获取最新的交易日期
exports.getLatestTradeDate = async () => {
  const url = "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.399001&fields1=f1&fields2=f51&klt=101&fqt=1&end=20500101&lmt=1";
  try {
    const response = await axios.get(url);
    const data = response.data;
    return data.data.klines[0];
  } catch (error) {
    throw new Error("Error executing getLatestTradeDate: " + error.message);
  }
};

//获取所有股票当日交易数据
exports.getAllStcokDailyTradeData = async () => {
  const url = "https://72.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=12000&po=1&np=1&fltt=2&invt=0&dect=1&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152";
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error("Error executing getAllStcokDailyTradeData: " + error.message);
  }
};
//同步每日个股数据到历史交易数据
exports.syncDailyTradeData2HistoryTradeData = async (tradeData) => {
  await stockModel.insertDailyTradeData2HistoryTradeData(tradeData);
};

//将全体个股写入数据库
exports.saveAllStcokDailyTradeData = async (latestTradeDate, dataJson) => {
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
exports.getAllStockBasicInfo = async (fields) => {
  const result = await stockModel.getAllStockBasicInfo([...fields]);
  return result;
};

//从DF获取个股历史数据
exports.getStockHistoryTradeData = async (secid, startDate, endDate, lmt) => {

  secid = secid.includes(".")
    ? secid
    : secid.startsWith("0") || secid.startsWith("3")
      ? "0." + secid
      : "1." + secid;

  // Set default values if not provided
  startDate = startDate || 0;
  endDate = endDate || 20250101;
  lmt = lmt || 12000;
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f3,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=${endDate}&beg=${startDate}&lmt=${lmt}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error("Error executing getStockHistoryTradeData: " + error.message);
  }
};
//从数据库获取个股历史数据
exports.getStockHistoryTradeDataFromDB = async (secid, startDate, endDate) => {

}

//将个股历史数据写入数据库
exports.saveStockHistoryTradeData = async (dataJson, connection) => {
  // const dataJson = JSON.parse(data);
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

//从DF获取异常个股交易状态
exports.getExceptStockState = async (code) => {
  const url = `http://gbapi.eastmoney.com/webarticlelist/api/Article/Articlelist?code=${code}`;

  try {
    const response = await axios.get(url);
    const dataJson = response.data;
    return dataJson.bar_info.Status;
  } catch (error) {
    throw new Error("Error executing getExceptStockState: " + error.message);
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

//获取股票分析结果数据服务
exports.getAnalyseStockListService = async (analyseDateStart, analyseDateEnd) => {
  try {
    const results = await stockModel.getAnalseStockList(analyseDateStart, analyseDateEnd);
    return results
  } catch (error) {
    throw new Error(
      "Error Excuting getAnalyseStockListService::" + error.message
    );
  }
}

//更新股票分析数据的累计涨跌情况
exports.updateStockAnalyseOneMonthService = async (latestDate) => {
  try {
    return await stockModel.updateStockAnalyseOneMonth(latestDate);
  } catch (error) {
    throw new Error(
      "Error Excuting updateStockAnalyseOneMonthService::" + error.message
    );
  }
}

//获取近一个月股票分析结果
exports.getLatestMonthAnalyseSituationService = async (latestDate) => {
  try {
    const results = await stockModel.getAnalyseStockDataMonth(latestDate);
    return results
  } catch (error) {
    throw new Error(
      "Error Excuting getLatestMonthAnalyseSituationService::" + error.message
    );
  }
}

//更新股票的标记状态，如果为1表示被选中
exports.updateStockAnalyseIsMarkService = async (code, analyseDate, analyseMethod, isMark) => {
  try {
    return await stockModel.updateStockAnalyseIsMark(code, analyseDate, analyseMethod, isMark);
  } catch (error) {
    throw new Error(
      "Error Excuting updateStockAnalyseIsMarkService::" + error.message
    );
  }
}

//获取K线相关数据
exports.getKlineDataService = async (code, startDate, endDate) => {
  try {
    return await stockModel.getKlineData(code, startDate, endDate);
  } catch (error) {
    throw new Error(
      "Error Excuting getKlineDataService::" + error.message
    );
  }
}

//获取股票每日涨跌数
exports.getStockUpDownRatioService = async (startDate, endDate) => {
  try {
    return await stockModel.getStockUpDownRatio(startDate, endDate);
  } catch (error) {
    throw new Error(
      "Error Excuting getStockUpDownRatioService::" + error.message
    );
  }
}

//获取股票预警数据
exports.getStockWarningDataService = async (waringDate, warningCreteria) => {
  try {
    return await stockModel.getStockWarningData(waringDate, warningCreteria);
  } catch (error) {
    throw new Error(
      "Error Excuting getStockWarningDataService::" + error.message
    );
  }
}

//获取历史最低股价
exports.getStockWarningHistoryMinService = async (waringDate) => {
  try {
    return await stockModel.getStockWarningHistoryMinData(waringDate);
  } catch (error) {
    throw new Error(
      "Error Excuting getStockWarningHistoryMinService::" + error.message
    );
  }
}

//历史最低股价计算服务
exports.calcStockWarningHistoryMinService = async () => {
  try {
    await stockModel.calcHistoryMinClose();
  } catch (error) {
    throw new Error(
      "Error Excuting calcStockWarningHistoryMinService::" + error.message
    );
  }
}

//更新评论服务
exports.addStockCommentService = async (uuid, code, analyseDate, analyseMethod, author, commentContent) => {
  try {
    await stockModel.addStockComment(uuid, code, analyseDate, analyseMethod, author, commentContent);
  } catch (error) {
    throw new Error(
      "Error Excuting addStockCommentService::" + error.message
    );
  }
}

//获取评论服务
exports.getStockCommentService = async (code, analyseDate, analyseMethod, author) => {
  try {
    return await stockModel.getStockComments(code, analyseDate, analyseMethod, author);
  } catch (error) {
    throw new Error(
      "Error Excuting getStockCommentService::" + error.message
    );
  }
}

//删除评论服务
exports.deleteStockCommentService = async (uuid) => {
  try {
    await stockModel.deleteStockComment(uuid);
  } catch (error) {
    throw new Error(
      "Error Excuting deleteStockCommentService::" + error.message
    );
  }
}