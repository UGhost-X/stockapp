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

exports.sendMailService = async (subject,content,htmlContent)=>{
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