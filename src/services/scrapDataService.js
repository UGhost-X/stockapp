var request = require("request");
const stockModel = require("../models/stockModel.js");

//设计原则：各服务应保持独立，在controll层再进行组合

//获取最新的交易日期
var getLastestTradeDateOptions = {
  method: "GET",
  url: "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.399001&fields1=f1&fields2=f51&klt=101&fqt=1&end=20500101&lmt=1",
};
const getLastestTradeDate = () => {
  return new Promise((resolve, reject) => {
    request(getLastestTradeDateOptions, (error, response) => {
      if (error) {
        reject(error);
      } else {
        const data = JSON.parse(response.body);
        resolve(data.data.klines[0]);
      }
    });
  });
};

//获取全体个股当日数据
var getAllStcokDailyTradeDataOptions = {
  method: "GET",
  url: "https://72.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=12000&po=1&np=1&fltt=2&invt=0&dect=1&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152",
};
const getAllStcokDailyTradeData = () => {
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

//将全体个股写入数据库
const saveAllStcokDailyTradeData = async (latestTradeDate,data) => {
  const dataJson = JSON.parse(data);
  const diffData = dataJson.data.diff;
  stockModel.setAllStockDailyTradeData(latestTradeDate, diffData);
};

module.exports = {
  getAllStcokDailyTradeData,
  getLastestTradeDate,
  saveAllStcokDailyTradeData,
};
