const nodemailer = require("nodemailer");
const logger = require("../../config/logconfig");

// 创建一个 SMTP 传输对象
const transporter = nodemailer.createTransport({
  host: "smtp.qq.com", // 邮件服务提供商的 SMTP 服务器地址
  port: 587, // SMTP 端口，常用端口有 587 和 465
  secure: false, // 如果使用 465 端口则为 true
  auth: {
    user: "396979850@qq.com", // 发送邮件的邮箱
    pass: "biyxfuxydgxpbhce", // 邮箱的授权码或密码
  },
});

exports.sendMailService = async (subject, content, htmlContent) => {
  const html = htmlContent || ''
  // 定义邮件内容
  const mailOptions = {
    from: '"daily-stock-reporter" <396979850@qq.com>', // 发件人
    to: "1129202430@qq.com", // 收件人
    subject: subject, // 邮件主题
    text: content, // 文本内容
    html: html, // HTML 内容（可选）1
  };

  // 发送邮件
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error("sendMail error occurred: " + error.message);
      throw new Error("sendMail error occurred: " + error.message);
    }
    logger.info("sendMail success: " + info.response);
  });
}


//股票分析结果模板邮件
exports.getAnalyseTableTemplete = (headers, rows,tableTitle) => {
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
  // const sortedRows = rows.sort((a, b) => parseInt(a[1]) - parseInt(b[1]));

  const tableRows = rows.map(row => {
    const cells = row.map((cell, index) => {
      // 条件判断：如果年龄低于27，则设置颜色为红色
      // const isAgeBelow27 = index === 1 && parseInt(cell) < 27;
      // return `<td style="${cellStyles} ${isAgeBelow27 ? conditionalStyle : ''}">${cell}</td>`;
      return `<td style="${cellStyles}">${cell}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('');

  return `
      <h3 style="font-family: 'Microsoft YaHei', sans-serif;text-align: center;">${tableTitle}</h3>
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

