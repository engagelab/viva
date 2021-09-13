module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json',],
  transform: {
    // '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.(js|jsx)?$': '<rootDir>/node_modules/babel-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!idb)', '/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)',
  ],
  testURL: 'http://localhost:8000/',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}
