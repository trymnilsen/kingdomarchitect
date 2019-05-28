const path = require("path");

module.exports = {
    entry: "./ts/src/main.ts",
    mode: "development",
    devtool: "source-map",
    stats: {
        // fallback value for stats options when an option is not defined (has precedence over local webpack defaults)
        all: false,
        errors: true,
        assets: true,
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
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".ts", ".js"]
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "public/dist")
    },
    externals: {
        konva: "Konva"
    }
};
