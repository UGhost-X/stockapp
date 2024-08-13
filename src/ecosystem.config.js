module.exports = {
    apps : [
        {
          name: "stockappbackend",
          script: "./src/index.js",
          watch: true,
          env: {
            NODE_ENV: 'dev'
          },
          env_prod: {
            NODE_ENV: 'prod'
          }
        }
    ]
  }