const stockService = require("../services/scrapDataService.js");

exports.getAllStockDailyTradeDataFromDF = async (req, res) => {
  const latestTradeDate = await stockService.getLastestTradeDate();
  const data = await stockService.getAllStcokDailyTradeData();
  try{
    stockService.saveAllStcokDailyTradeData(latestTradeDate, data);
    res.status(200).json({message:"get all stock trade data success"})
  }catch(error){
    res.status(500).json({message:"get all stock trade data failed"})
  }
};
 