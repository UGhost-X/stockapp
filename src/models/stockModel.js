const mysql = require("mysql");
const dbConfig = require("../../config/dbConfig");

const connection = mysql.createConnection(dbConfig);

exports.getAllStockDailyTradeData = async () => {
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

exports.setAllStockDailyTradeData = (stockDate, data) => {
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
    // 使用事务来确保数据的一致性和完整性
    connection.beginTransaction(function (err) {
      if (err) throw err;
      // 使用 query 方法执行批量插入
      connection.query(
        insertQuery,
        [batchValues],
        function (error) {
          if (error) {
            console.error("Error inserting data:", error);
            connection.rollback(function () {
              // 回滚事务
            });
          } else {
            // 如果所有插入成功，则提交事务
            connection.commit(function (err) {
              if (err) {
                console.error("Error committing transaction:", err);
                connection.rollback(function () {
                  // 回滚事务
                });
              } else {
                // 断开连接
                connection.end();
              }
            });
          }
        }
      );
    });
  } catch (error) {
    console.error(error);
  }
};
