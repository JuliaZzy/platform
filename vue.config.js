module.exports = {
  // 公共路径配置
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',

  // 配置开发服务器的代理
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src'),
      },
    },
  },

};

