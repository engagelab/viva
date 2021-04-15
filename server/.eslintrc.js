module.exports = {
  root: true,
  parser:"babel-eslint",
  parserOptions: {
    ecmaVersion: 2017,
  },
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended', 'prettier'],
}
