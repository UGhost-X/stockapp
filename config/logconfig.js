const winston = require('winston');

// 创建一个 logger 实例
const logger = winston.createLogger({
  level: 'info', // 设置日志级别
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json() // 将日志格式化为 JSON
  ),
  transports: [
    new winston.transports.File({ // 日志文件配置
      filename: './logs/app.log',
      tailable: true,
      maxsize: 1024 * 1024 * 5, // 文件最大大小 5MB
      maxFiles: 5 // 最多保留 5 个日志文件
    })
  ]
});

// 如果你还需要在控制台上显示日志，可以添加控制台输出
if (process.env.NODE_ENV !== 'prod') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 使用 logger 实例记录日志
// logger.info('This is an info message');
// logger.error('This is an error message');

// 示例：处理错误
// try {
//   throw new Error('Something went wrong');
// } catch (error) {
//   logger.error(error.message);
// }

module.exports = logger;