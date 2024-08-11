const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

//获取所有个股当日交易数据
router.get(
  "/getAllStockDailyTradeDataFromDF",
  stockController.getAllStockDailyTradeDataFromDF
);
//根据secid获取个股历史数据
router.post(
  "/getStockHistoryTradeDataFromDF",
  stockController.getStockHistoryTradeDataFromDF
);
//从每日交易表里同步股票基础信息
router.get(
  "/syncStockBasicInfoFromDailyTradeData",
  stockController.syncStockBasicInfoFromDailyTradeData
);
//使用多线程获取所有个股历史数据
router.post(
  "/getStockHistoryTradeDataFromDFByMultilLine",
  stockController.getStockHistoryTradeDataFromDFByMultilLine
);

router.post(
  "/getExceptStockStateFromDF",
  stockController.getExceptStockStateFromDF
);

module.exports = router;
