const { defineConfig } = require('@vue/cli-service')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
      },
    },
    plugins: [new NodePolyfillPlugin()],
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://172.18.182.82:3000', // 后端API服务器地址
        changeOrigin: true, // 是否改变域名
        pathRewrite: {
          '^/api': '' // 移除路径前缀
        }
      }
    }
  }
})
