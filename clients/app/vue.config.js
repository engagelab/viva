// vue.config.js
const fs = require('fs')
const host = process.env.VUE_APP_SERVER_HOST
const port = process.env.VUE_APP_SERVER_PORT
const hotHost = process.env.VUE_APP_HOTRELOAD_SERVER_HOST
const hotPort = process.env.VUE_APP_HOTRELOAD_SERVER_PORT_APP
const https_key = fs.readFileSync(process.env.SSL_KEY_FILE)
const https_cert = fs.readFileSync(process.env.SSL_CERT_FILE)

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin

module.exports = {
  pluginOptions: {
    i18n: {
      locale: 'no',
      fallbackLocale: 'no',
      localeDir: 'locales',
      enableInSFC: true
    },
    cordovaPath: 'src-cordova'
  },
  publicPath: process.env.BASE_URL || '',
  outputDir: 'www',
  configureWebpack: {
    devtool: 'source-map',
  },
/*   configureWebpack: {
    devtool: 'inline-source-map',
    resolve: {
      alias: {
        '@': `${__dirname}/src`
      }
    },
    plugins:
      process.env.NODE_ENV == 'testing' ? [new BundleAnalyzerPlugin()] : []
  }, */
  chainWebpack: config => {
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
      .loader('@kazupon/vue-i18n-loader')
      .end()
    config.plugin('html').tap(args => {
      const tmp = args[0]
      tmp.template = 'src/index.html'
      tmp.favicon = 'src/assets/icons/favicon.ico'
      return args
    })
    if (process.env.NODE_ENV === 'development') {
      config.output.filename('[name].[hash].js').end()
    }
  },
  productionSourceMap: false,
  devServer: {
    https: {
      key: https_key,
      cert: https_cert,
    },
    index: 'index.html',
    host: hotHost,
    port: hotPort,
    overlay: {
      warnings: true,
      errors: true
    },
    proxy: {
      '/api': {
        target: `${host}:${port}`,
        changeOrigin: true,
      },
      '/auth': {
        target: `${host}:${port}`,
        changeOrigin: true,
      },
      '/upload': {
        target: `${host}:${port}`,
        changeOrigin: true
      }
    }
  }
}
