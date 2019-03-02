module.exports = {
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js"
    ],
    "globals": {
        "ts-jest": {
          "diagnostics": false
        }
      },
    "roots": [
        "<rootDir>/ts/test"
      ],
    "transform": {
      "\\.(ts|tsx)$": "ts-jest"
    },
    "testRegex": ".*Test\.(ts|tsx|js)$"
  };