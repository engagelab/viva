module.exports = {
  env: {
    node: true
  },
  extends: ["plugin:vue/essential"],
  rules: {
    "vue/no-parsing-error": [2, { "x-invalid-end-tag": false }],
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "comma-dangle": ["error", "only-multiline"],
    quotes: ["error", "single"]
  },
  parserOptions: {
    parser: "babel-eslint",
    ecmaVersion: 6
  }
};
