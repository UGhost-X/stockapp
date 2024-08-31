const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

//获取股票最新交易日
router.get(
  "/getLatestTradeDate",
  stockController.getLatestTradeDate
);


//获取所有个股当日交易数据
router.get(
  "/getAllStockDailyTradeDataFromDF",
  stockController.getAllStockDailyTradeDataFromDF
);
//获取股票基本信息
router.post(
  "/getStockBasicInfoFromDB",
  stockController.getStockBasicInfoFromDB
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

//获取预警数据
router.post(
  "/getStockWaringData",
  stockController.getStockWaringData
);
//获取历史最低预警数据
router.post(
  "/getStockWaringhistoryMinData",
  stockController.getStockWaringhistoryMinData
);

//获取股票分析数据
router.post(
  "/getStockAnalyseDate",
  stockController.getStockAnalyseDate
);


//更新股票评论
router.post(
  "/addStockCommentData",
  stockController.addStockCommentData
);

//获取股票评论
router.post(
  "/getStockCommentData",
  stockController.getStockCommentData
);

//删除股票评论
router.post(
  "/deleteStockCommentData",
  stockController.deleteStockCommentData
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

