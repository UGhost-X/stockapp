module.exports = {
    apps : [
        {
          name: "stockappbackend",
          script: "./src/index.js",
          watch: false,
          env: {
            NODE_ENV: 'dev'
          },
          env_prod: {
            NODE_ENV: 'prod'
          },
          // restart_delay: 5000, // 重启延迟时间，单位毫秒
          // max_restarts: 5 // 允许的最大重启次数
          autorestart: true
        }
    ]
  }
