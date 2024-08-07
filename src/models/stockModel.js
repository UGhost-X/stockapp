const mysql = require("mysql");
const dbConfig = require("../../config/dbConfig");
const util = require("util");

exports.getMySqlConnection = async () => {
  return mysql.createConnection(dbConfig);
};

//同步股票基本信息
exports.setAllStockBasicInfo = async () => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const beginTransaction = util
    .promisify(connection.beginTransaction)
    .bind(connection);
  const commit = util.promisify(connection.commit).bind(connection);
  const end = util.promisify(connection.end).bind(connection);

  const truncateQuery = `
    truncate table stock_basic_info;
  `;
  const insertQuery = `
    insert into stock_basic_info  select stock_code,stock_ch_name,null,created_date,update_date from daily_trades;
  `;
  try {
    await beginTransaction();
    await query(truncateQuery);
    await query(insertQuery);
    await commit();
  } catch (error) {
    throw new Error("Error executing setAllStockBasicInfo::" + error.message);
  } finally {
    await end();
  }
};

//获取股票基本信息
exports.getAllStockBasicInfo = async () => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  const basicQuery = `
    select stock_code from stock_basic_info
  `;
  try {
    const result = await query(basicQuery);
    return result;
  } catch (error) {
    throw new Error("Error executing getAllStockBasicInfo::" + error.message);
  } finally {
    await end();
  }
};

exports.getAllStockDailyTradeData = async () => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const beginTransaction = util
    .promisify(connection.beginTransaction)
    .bind(connection);
  const commit = util.promisify(connection.commit).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM daily_trades", (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

//写入所有个股每日交易数据
exports.setAllStockDailyTradeData = async (stockDate, data) => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const beginTransaction = util
    .promisify(connection.beginTransaction)
    .bind(connection);
  const commit = util.promisify(connection.commit).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  // 准备批量插入的数据
  const insertQuery = `
      INSERT IGNORE INTO daily_trades (
        stock_code, stock_date, stock_ch_name, close, pct_ratio, pct_chg,
        volume, amount, pct_chg_ratio, chg_ratio, mp_ratio, amount_ratio,
        high, low, open, pre_close, total_market_value, floating_market_value,
        market_net_value
      ) VALUES ?;
    `;

  // 构建批量插入的数组
  const batchValues = data.map((item) => [
    item.f12, // stock_code
    stockDate, // stock_date
    item.f14, // stock_ch_name
    item.f2, // close
    item.f3, // pct_ratio
    item.f4, // pct_chg
    item.f5, // volume
    item.f6, // amount
    item.f7, // pct_chg_ratio
    item.f8, // chg_ratio
    item.f9, // mp_ratio
    item.f10, // amount_ratio
    item.f15, // high
    item.f16, // low
    item.f17, // open
    item.f18, // pre_close
    item.f20, // total_market_value
    item.f21, // floating_market_value
    item.f23, // market_net_value
  ]);
  try {
    await beginTransaction();
    await query(insertQuery);
    await commit();
  } catch (error) {
    throw new Error("Error executing setAllStockBasicInfo::" + error.message);
  } finally {
    await end();
  }
};

// 写入个股历史数据
exports.setStockHistoryTradeData = async (stockCode, stockName, data, connection) => {
  // const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const beginTransaction = util
    .promisify(connection.beginTransaction)
    .bind(connection);
  const commit = util.promisify(connection.commit).bind(connection);
  const insertQuery = `
    INSERT IGNORE INTO stock_history_trade 
    (stock_code, stock_ch_name, trade_date, open, close, high, low, volume, amount, pct_chg_ratio, pct_ratio, pct_chg, chg_ratio) 
    VALUES ?;
  `;

  // 构建批量插入的数组
  const batchValues = data.map((item) => {
    const fields = item.split(","); // 将字符串按逗号分割
    return [
      stockCode, // 股票代码
      stockName, // 股票名称
      fields[0], // trade_date: 交易日期
      parseFloat(fields[1]).toFixed(2), // open: 开盘价
      parseFloat(fields[2]).toFixed(2), // close: 收盘价
      parseFloat(fields[3]).toFixed(2), // high: 最高价
      parseFloat(fields[4]).toFixed(2), // low: 最低价
      parseInt(fields[5], 10), // vol: 成交量
      parseFloat(fields[6]).toFixed(2), // amount: 成交额
      parseFloat(fields[7]).toFixed(2), // pct_chg_ratio: 振幅 (最高价 / 最低价)
      parseFloat(fields[8]).toFixed(2), // pct_ratio: 涨跌幅
      parseFloat(fields[9]).toFixed(2), // pct_chg: 涨跌额 (收盘价 - 开盘价)
      parseFloat(fields[10]).toFixed(2), // chg_ratio: 换手率 (成交量 / 成交额)
    ];
  });

  try {
    await beginTransaction();
    await query(insertQuery, [batchValues]);
    await commit();
  } catch (error) {
    throw new Error(
      "Error executing setStockHistoryTradeData::" + error.message
    );
  } 
};
