module.exports = {
  'extends': './node_modules/grumbler-scripts/config/.eslintrc-browser.js',

  ignorePatterns: ["**/node_modules/**"],

  // TODO: revert to what it use to be
  //
  "globals": {
    "NodeJS": true
  },

  'rules': {
    'promise/no-native': 'off',
    'no-restricted-globals': 'off',
    "no-mixed-operators": 'off',
    "@typescript-eslint/ban-types": "off"
  }
};
