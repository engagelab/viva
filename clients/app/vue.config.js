// vue.config.js
const fs = require('fs')
const host = process.env.VUE_APP_SERVER_HOST
const port = process.env.VUE_APP_SERVER_PORT
const https_key = fs.readFileSync(process.env.SSL_KEY_FILE)
const https_cert = fs.readFileSync(process.env.SSL_CERT_FILE)

module.exports = {
  pluginOptions: {
    i18n: {
      locale: 'no',
      fallbackLocale: 'no',
      localeDir: 'locales',
      enableInSFC: true,
    },
    cordovaPath: 'src-cordova',
  },
  publicPath: process.env.BASE_URL || '',
  outputDir: 'www',
  configureWebpack: {
    devtool: 'source-map',
  },
  chainWebpack: (config) => {
    config.module
      .rule('i18n-resource')
      .test(/\.(json5?|ya?ml)$/)
      .type('javascript/auto')
      .use('i18n-resource')
      .loader('@intlify/vue-i18n-loader')
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
      .loader('@intlify/vue-i18n-loader')
    config.plugin('html').tap((args) => {
      const tmp = args[0]
      tmp.template = 'src/index.html'
      tmp.favicon = 'src/assets/icons/favicon.ico'
      return args
    })
    // raw-loader is for loading querys in .txt files
    config.module
      .rule('raw')
      .test(/\.(gql|graphql|txt)$/i)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
    config.plugin('fork-ts-checker').tap((args) => {
      args[0].typescript = { configFile: '../../tsconfig.json' }
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
    host: 'localhost',
    port: '8082',
    overlay: {
      warnings: true,
      errors: true,
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
        changeOrigin: true,
      },
    },
  },
}
