const dotenv = require("dotenv");
const mysql = require("mysql");



// 创建连接池
const pool = mysql.createPool({
    host: '47.120.35.88',
    user: 'root',
    password: '!Sxq599635',
    database: 'stockdata',
    charset: 'utf8mb4',
});

// 查询数据
async function queryTest(tradeData) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(new Error(`Error getting connection: ${err.message}`));
                return;
            }



            // 使用参数化查询来防止 SQL 注入
            const getQuery = `SELECT * FROM stockdata.stock_history_trade sht WHERE trade_date = ? LIMIT 1`;

            connection.query(getQuery, [tradeData], (error, results, fields) => {
                connection.release(); // 释放连接

                if (error) {
                    reject(new Error(`Error executing getDailyTradeStockAmount: ${error.message}`));
                } else {
                    // 处理查询结果
                    const headers = Object.keys(results[0]); // 获取列名作为表头
                    const rows = results.map(row => Object.values(row)); // 将每行数据转换为数组
                    resolve({
                        headers,
                        rows
                    });
                }
            });
        });
    });
}

// 调用查询函数
(async () => {
    try {
        const tradeData = '2024-08-12'; // 示例日期
        const result = await queryTest(tradeData);
        console.log('Result:', result);
    } catch (error) {
        console.error('Failed to query table:', error);
    }
})();