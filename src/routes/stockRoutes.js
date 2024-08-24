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

//用来获取股票的交易状态
router.post(
  "/getExceptStockStateFromDF",
  stockController.getExceptStockStateFromDF
);

//获取K线数据
router.post(
  "/getKlineDateFromDB",
  stockController.getKlineDateFromDB
);

//更新股票标记状态
router.post(
  "/updateStockAnalyseIsMarkStatus",
  stockController.updateStockAnalyseIsMarkStatus
);


//--------------测试---------------//
router.post(
  "/sendEmailTest",
  stockController.sendEmailTest
)

router.get(
  "/syncStockTaskTest",
  stockController.syncStockTaskTest
)

router.post(
  "/getStockHistoryTradeDataFromDB",
  stockController.getStockHistoryTradeDataFromDB
)

router.get(
  "/getDailyTradeStockAmountTest",
  stockController.getDailyTradeStockAmountTest
)

module.exports = router;

