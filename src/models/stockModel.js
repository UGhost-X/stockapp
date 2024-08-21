const mysql = require("mysql");
const dbConfig = require("../../config/dbconfig");
const util = require("util");
const logger = require("../../config/logconfig");

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
    insert into stock_basic_info select stock_code,stock_ch_name,null,stock_date,null,null,null,created_date,update_date from daily_trades;
  `;
  //需要手动补充上上证、深证、创业版的基本信息
  const insertQueryByExtraInfo = `
    insert into stock_basic_info(stock_code,stock_ch_name) values ?;
  `;
  const insertQueryByExtraInfoData = [
    ["1.000001", "上证指数"],
    ["0.399001", "深证成指"],
    ["0.399006", "创业板指"],
  ];

  //同步上市日期
  const updateListingDataQuery = `
  UPDATE stock_basic_info a
  JOIN (
    SELECT stock_code, MIN(trade_date) AS stock_listing_date
    FROM stock_history_trade
    GROUP BY stock_code
  ) b ON a.stock_code = b.stock_code
  SET a.stock_listing_date = b.stock_listing_date;
  `;

  //同步最新交易日期
  const updateLatestTradeDateQuery = `
  UPDATE stockdata.stock_basic_info a join 
    (select stock_code, MAX(trade_date) as stock_lastest_trade_date  from stockdata.stock_history_trade sht   group by stock_code ) b
    on a.stock_code =b.stock_code
    set a.stock_lastest_trade_date =b.stock_lastest_trade_date;
  `
  //交易间隔，交易状态
  const updataTradeDateInterval = `
    UPDATE stockdata.stock_basic_info set stock_trade_interval = DATEDIFF(stock_current_trade_date ,stock_lastest_trade_date) ;
  `
  const updataTradeStatus0 = `
    UPDATE stockdata.stock_basic_info set stock_trade_status = 'Normal' where stock_trade_interval <= 7 and stock_trade_interval is  not NULL ;
  `
  const updataTradeStatus1 = `
    UPDATE stockdata.stock_basic_info set stock_trade_status = 'Exception' where stock_trade_interval > 7;
  `
  const updataTradeStatus2 = `
    UPDATE stockdata.stock_basic_info set stock_trade_status = 'Others' where stock_trade_interval is null;
  `


  try {
    await beginTransaction();
    await query(truncateQuery);
    await query(insertQuery);
    await query(insertQueryByExtraInfo, [insertQueryByExtraInfoData]);
    await query(updateListingDataQuery);
    await query(updateLatestTradeDateQuery);
    await query(updataTradeDateInterval);
    await query(updataTradeStatus0);
    await query(updataTradeStatus1);
    await query(updataTradeStatus2);
    await commit();
  } catch (error) {
    throw new Error("Error executing setAllStockBasicInfo::" + error.message);
  } finally {
    await end();
  }
};

//从数据库获取股票基本信息
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

//从数据库获取所有个股当日交易数据
exports.getAllStockDailyTradeData = async () => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  return new Promise(async (resolve, reject) => {
    await query(
      "SELECT * FROM daily_trades",
      async (error, results, fields) => {
        if (error) {
          await end();
          reject(error);
        } else {
          await end();
          resolve(results);
        }
      }
    );
  });
};

//同步当日交易数据到历史数据
exports.insertDailyTradeData2HistoryTradeData = async (tradeDate) => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  let insertQuery = `
    INSERT ignore into stock_history_trade(stock_code,stock_ch_name,trade_date,\`open\`
    ,\`close\`,high,low,volume,amount,pct_chg_ratio,pct_ratio,pct_chg,chg_ratio) 
    select stock_code,stock_ch_name,\'${tradeDate}\',\`open\`
    ,\`close\`,high,low,volume,amount,pct_chg_ratio,pct_ratio,pct_chg,chg_ratio from daily_trades
     where \`open\`>0;
    `;
  try {
    if (!tradeDate) {
      throw new Error("提供的日期有误::" + tradeDate);
    }
    await query(insertQuery);
  } catch (error) {
    throw new Error(
      "Error executing syncDailyTradeDataToHistoryTradeData::" + error.message
    );
  } finally {
    await end();
  }
};

//数据库写入所有个股当日交易数据
exports.setAllStockDailyTradeData = async (stockDate, data) => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const beginTransaction = util
    .promisify(connection.beginTransaction)
    .bind(connection);
  const commit = util.promisify(connection.commit).bind(connection);
  const end = util.promisify(connection.end).bind(connection);

  const truncateQuery = `
  truncate table daily_trades;
  `;

  // 准备批量插入的数据
  const insertQuery = `
  INSERT IGNORE INTO daily_trades (
    stock_code, stock_date, stock_ch_name, close, pct_ratio, pct_chg,
    volume, amount, pct_chg_ratio, chg_ratio, mp_ratio, amount_ratio,
    high, low, open, pre_close, total_market_value, floating_market_value,
    market_net_value
  ) VALUES ?
   ;
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
    await query(truncateQuery);
    await query(insertQuery, [batchValues]);
    await commit();
  } catch (error) {
    logger.error(
      "Error executing setAllStockBasicInfo::" +
      error.message +
      ":::" +
      batchValues
    );
    throw new Error("Error executing setAllStockBasicInfo::" + error.message);
  } finally {
    await end();
  }
};

// 数据库写入个股历史数据
exports.setStockHistoryTradeData = async (
  stockCode,
  stockName,
  data,
  connection
) => {
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

// 获取当日同步到历史数据库的数据数量
exports.getDailyTradeStockAmount = async (tradeData) => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  let getQuery = `
    select COUNT(1) as amount from stockdata.stock_history_trade sht where trade_date=?;
  `
  try {
    const result = await query(getQuery, [tradeData]);
    return result;
  } catch (error) {
    throw new Error(
      "Error executing getDailyTradeStockAmount::" + error.message
    );
  } finally {
    await end();
  }
}

// 获取股票分析数据
exports.getAnalseStockList = async (analyseDateStart, analyseDateEnd) => {
  analyseDateEnd = analyseDateEnd || analyseDateStart;

  // 创建数据库连接
  const connection = mysql.createConnection(dbConfig);

  // 将 connection.query 方法转换为支持 Promise 的形式
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);

  // 查询 SQL 语句
  const getQuery = `
    SELECT sac.stock_code, sbi.stock_ch_name, sac.analyse_date, sac.one_month_change,
           sac.one_month_change_date, sac.analyse_day_price, sac.purchase_price, sac.anylse_method
    FROM stockdata.stock_analyse_collection sac
    INNER JOIN stockdata.stock_basic_info sbi ON sac.stock_code = sbi.stock_code
    WHERE sac.analyse_date BETWEEN ? AND ?
    ORDER BY sbi.stock_code, sac.analyse_date;
  `;

  try {
    // 执行查询
    const results = await query(getQuery, [analyseDateStart, analyseDateEnd]);

    // 获取字段名
    const fields = Object.keys(results[0] || {});
    const headers = fields.map(field => field.trim());

    // 将结果转换为二维数组
    const rows = results.map(result => {
      return headers.map(header => result[header]);
    });

    // 返回结果
    return {
      headers: headers,
      rows: rows
    };
  } catch (error) {
    // 捕获并抛出错误
    throw new Error(`Error executing getAnalseStockList: ${error.message}`);
  } finally {
    // 关闭数据库连接
    await end();
  }
};

const _ = require("lodash");
// 按照日期/代码获取股票历史数据
exports.getHistoryTradeData = async (startDate, endDate) => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);

  const dataQuery = `
    SELECT stock_code, stock_ch_name,trade_date, close, high, open, pct_ratio 
    FROM stockdata.stock_history_trade
    WHERE  (trade_date BETWEEN ? AND ? ) order by trade_date desc ,stock_code
  `;
  try {
    // 执行查询
    const [...rows] = await query(dataQuery, [startDate, endDate]);
    // 分组数据
    const dataGrouped = _.groupBy(rows, 'stock_code');
    return dataGrouped;
  } catch (error) {
    logger.error('Error fetching or grouping data:', error.message);
    throw error;
  } finally {
    await end();
  }
}


//股票分析数据写入数据库
exports.setAnalyseData = async (data) => {
  const connection = mysql.createConnection(dbConfig);
  const query = util.promisify(connection.query).bind(connection);
  const end = util.promisify(connection.end).bind(connection);
  const insertQuery = `
   INSERT ignore INTO stockdata.stock_analyse_collection (stock_code, analyse_date, one_month_change, one_month_change_date,analyse_day_price, purchase_price,anylse_method)
        VALUES ?
  `;
  try {
    // 执行插入
    await query(insertQuery, [data]);
  } catch (error) {
    logger.error('setAnalyseData failed:::'+ error.message);
    throw error;
  } finally {
    await end();
  }
}