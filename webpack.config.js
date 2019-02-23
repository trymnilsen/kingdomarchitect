const path = require('path');

module.exports = {
  entry: './ts/client/main.ts',
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,

      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.ts', '.js' ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist')
  },
  externals: {
      konva: 'Konva'
  }
};