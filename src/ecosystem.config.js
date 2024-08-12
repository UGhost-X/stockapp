module.exports = {
    apps : [
        {
          name: "stockappbackend",
          script: "./index.js",
          watch: true,
          env_prod: {
            "PORT": 3000,
            "NODE_ENV": "prod",
          }
        }
    ]
  }