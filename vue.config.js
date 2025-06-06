module.exports = {
  // 公共路径配置
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',

  // 配置开发服务器的代理
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 设置为后端服务器地址
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // 配置 Webpack（例如，路径别名）
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src'), // 设置 '@' 为 src 目录的别名
      },
    },
  },

  // 可以开启 Vue Router 的 history 模式
};

