const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./ts/src/client/main.ts",
  mode: "development",
  devtool: "source-map",
  stats: {
    // fallback value for stats options when an option is not defined (has precedence over local webpack defaults)
    all: false,
    errors:true,
    assets:true,
    timings: true
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig-client.json"
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader"
        ]
      }
    ]
  },
  resolve: {
    extensions: [ ".ts", ".ts", ".js" ]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public/dist")
  },
  externals: {
      konva: "Konva"
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
};
