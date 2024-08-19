const stockService = require("../services/scrapDataService.js");
const stockAnalysis = require("../services/stockAnalysis.js");
const stockModel = require("../models/stockModel.js");
const pLimit = require("p-limit");
const logger = require("../../config/logconfig");
const sendMailService = require("../services/mailSMTPService");


//获取所有股票当日交易数据
exports.getAllStockDailyTradeDataFromDF = async (req, res) => {
  try {
    const latestTradeDate = await stockService.getLastestTradeDate();
    const data = await stockService.getAllStcokDailyTradeData();
    stockService.saveAllStcokDailyTradeData(latestTradeDate, data);
    res.status(200).json({ message: "get all stock trade data success" });
  } catch (error) {
    res.status(500).json({ message: "get all stock trade data failed" });
  }
};

//根据提供的股票代码获取数据
exports.getStockHistoryTradeDataFromDF = async (req, res) => {
  try {
    let { secid, startDate, endData, lmt } = req.query;
    secid =
      secid.startsWith("0") || secid.startsWith("3")
        ? "0." + secid
        : "1." + secid;
    const data = await stockService.getStockHistoryTradeData(
      secid,
      startDate,
      endData,
      lmt
    );
    const connection = await stockModel.getMySqlConnection(); // 创建数据库连接
    await stockService.saveStockHistoryTradeData(data, connection);
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "get stock history trade data failed:::" + error });
  } finally {
    connection.end();
  }
};

// 获取股票历史数据并保存到数据库
exports.getStockHistoryTradeDataFromDFByMultilLine = async (req, res) => {
  let { startDate, endData, lmt } = req.query;
  const connection = await stockModel.getMySqlConnection(); // 创建数据库连接
  try {
    const stockBasicInfo = await stockService.getAllStockBasicInfo(); // 传递连接
    const stockCodes = stockBasicInfo.map((row) => row.stock_code);

    const limit = pLimit(10); // 设置并发限制

    await Promise.all(
      stockCodes.map((code) =>
        limit(async () => {
          try {
            const data = await stockService.getStockHistoryTradeData(
              code,
              startDate,
              endData,
              lmt
            ); // 传递连接
            await stockService.saveStockHistoryTradeData(data, connection); // 传递连接
          } catch (error) {
            // 在每次追加前添加一个换行符
            global.syncDailyTradeInfoEmailContent += `\nError fetching data for ${code}`;

            // 如果您希望在第一次追加时不出现换行符，您可以检查当前的内容是否为空
            if (global.syncDailyTradeInfoEmailContent === "") {
              global.syncDailyTradeInfoEmailContent += `Error fetching data for ${code}`;
            } else {
              global.syncDailyTradeInfoEmailContent += `\nError fetching data for ${code}`;
            }

            logger.error(
              `Error fetching data for ${code}:`,
              error.message
            );
          }
        })
      )
    );
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res.status(500).json({ message: "get stock history trade data failed" });
  } finally {
    logger.info("########----  数据已经下载完成  ----#####");
    connection.commit();
    connection.end(); // 确保在所有操作完成后关闭连接
  }
};

//从每日交易数据同步数据至基础信息表
exports.syncStockBasicInfoFromDailyTradeData = async (req, res) => {
  try {
    await stockService.syncStockBasicInfo();
    res.status(200).json({ message: "get stock history trade data success" });
  } catch (error) {
    res.status(500).json({
      message: "get stock history trade data failed::" + error.message,
    });
  }
};

//获取个股交易状态
exports.getExceptStockStateFromDF = async (req, res) => {
  const { stockCode } = req.query;
  try {
    const stock_trade_status = await stockService.getExceptStockState(
      stockCode
    );
    logger.info("get stock trade status success::" + stock_trade_status);
    res.status(200).json({
      message: "get stock trade status success::" + stock_trade_status,
    });
  } catch (error) {
    logger.error(
      "get stock trade status success::" + stock_trade_status
    );
    res.status(500).json({
      message: "get stock trade status failed::" + error.message,
    });
  }
};









// ----------------------测试-------------------------------------//

//邮件发送测试
exports.sendEmailTest = async (req, res) => {
  // 示例：获取数据库中的数据（模拟）
  const getDataFromDatabase = async () => {
    // 模拟数据库数据
    return {
      headers: ['姓名', '年龄', '城市'],
      rows: [
        ['张三', '30', '北京'],
        ['李四', '25', '上海'],
        ['王五', '27', '天津']
      ]
    };
  };

  const generateTableHtml = (headers, rows) => {
    // 设置表头和单元格的通用样式
    const tableStyles = `
      font-family: 'Microsoft YaHei', sans-serif; /* 使用微软雅黑字体 */
      border-collapse: collapse;
      width: 100%;
      color: #151d29
    `;
    const headerStyles = `
      background-color: #e5a84b;
      border: 1px solid #ddd;
      padding: 12px;
      text-align: center;
      font-weight: bold; /* 表头字体加粗 */
      font-size: 16px;
    `;
    const cellStyles = `
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    `;
    const conditionalStyle = `
      color: #c12c1f
    `;

    const tableHeader = headers.map(header =>
      `<th style="${headerStyles}">${header}</th>`
    ).join('');

    // 排序行数据
    const sortedRows = rows.sort((a, b) => parseInt(a[1]) - parseInt(b[1]));

    const tableRows = sortedRows.map(row => {
      const cells = row.map((cell, index) => {
        // 条件判断：如果年龄低于27，则设置颜色为红色
        const isAgeBelow27 = index === 1 && parseInt(cell) < 27;
        return `<td style="${cellStyles} ${isAgeBelow27 ? conditionalStyle : ''}">${cell}</td>`;
      }).join('');

      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <h3 style="font-family: 'Microsoft YaHei', sans-serif;">这是一个动态生成的表格：</h3>
      <table style="${tableStyles}">
          <thead>
              <tr>
                  ${tableHeader}
              </tr>
          </thead>
          <tbody>
              ${tableRows}
          </tbody>
      </table>
    `;
  };

  try {
    const data = await getDataFromDatabase();
    const tableHtml = generateTableHtml(data.headers, data.rows);
    logger.info("邮件正在发送...");
    await sendMailService.sendMailService('test', "hello world", tableHtml);
    logger.info("邮件发送完成");
    res.status(200).json({ message: "send email success" });
  } catch (error) {
    res.status(500).json({ message: "send email failed::" + error.message });
    throw new Error("Error invokes in sendEmailTest::" + error.message)
  }
};

const schedularTask = require('../schedulars/stockTask.js')
//定时任务功能测试
exports.syncStockTaskTest = async (req, res) => {

  try {
    const stock_trade_status = await schedularTask.syncDailyStockTradeDataTask()
    logger.info("get stock trade status success::" + stock_trade_status);
    res.status(200).json({
      message: "get stock trade status success::" + stock_trade_status,
    });
  } catch (error) {
    logger.error(
      "get stock trade status success::" + stock_trade_status
    );
    res.status(500).json({
      message: "get stock trade status failed::" + error.message,
    });
  }

}

//量能法分析
exports.getStockHistoryTradeDataFromDB = async (req,res) => {
  const { startDate,endDate } = req.query;

  try {
    logger.info("数据开始分析.......");
    const dataGrouped =  await stockAnalysis.getHistoryTradeDataService(startDate,endDate);
    logger.info("获取数据已完成...");
    await stockAnalysis.volumeEnergyService(dataGrouped,16);
    logger.info("数据分析已完成...");
    res.status(200).json({
      message: "getStockHistoryTradeDataFromDB success"
    });
  } catch (error) {
    logger.error(
      "getStockHistoryTradeDataFromDB failed::" + error.message,
    );
    res.status(500).json({
      message: "getStockHistoryTradeDataFromDB failed::" + error.message,
    });
  }
}
