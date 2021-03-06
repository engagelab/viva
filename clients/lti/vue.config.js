// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
const host = process.env.VUE_APP_SERVER_HOST
const port = process.env.VUE_APP_SERVER_PORT
const https_key = fs.readFileSync(process.env.SSL_KEY_FILE)
const https_cert = fs.readFileSync(process.env.SSL_CERT_FILE)
let baseUrl = process.env.BASE_URL || '/'

if (host.includes('engagelab')) {
  baseUrl = '/viva/lti/'
} else if (process.env.NODE_ENV === 'development') {
  baseUrl = ''
} else {
  baseUrl = '/lti/'
}

module.exports = {
  publicPath: baseUrl,
  outputDir: 'www',
  pluginOptions: {
    cordovaPath: 'src-cordova',
  },
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      const tmp = args[0]
      tmp.template = 'src/index.html'
      tmp.favicon = 'src/assets/icons/favicon.ico'
      return args
    })
    if (process.env.NODE_ENV === 'development') {
      config.output.filename('[name].[hash].js').end()
    }
    // raw-loader is for loading querys in .txt files
    config.module
      .rule('raw')
      .test(/\.(gql|graphql|txt)$/i)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
    config.plugin('fork-ts-checker').tap((args) => {
      args[0].typescript = { configFile: './tsconfig.json' }
      return args
    })
  },
  productionSourceMap: false,
  configureWebpack: {
    devtool: 'source-map',
  },
  devServer: {
    https: {
      key: https_key,
      cert: https_cert,
    },
    index: 'index.html',
    host: 'localhost',
    port: '8080',
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
    },
  },
}
