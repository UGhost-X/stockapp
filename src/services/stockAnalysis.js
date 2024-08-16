let request = require("request");
const stockModel = require("../models/stockModel.js");
const logger = require("../../config/logconfig.js");


exports.getHistoryTradeDataService = (code, startDate, endDate) => {
    const result = stockModel.getHistoryTradeData(code, startDate, endDate)
    return result;
}