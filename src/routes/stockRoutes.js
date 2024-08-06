const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/getAllStockDailyTradeDataFromDF', stockController.getAllStockDailyTradeDataFromDF);

module.exports = router;