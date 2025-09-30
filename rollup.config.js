import { defineConfig } from "rollup";
import sourcemaps from "rollup-plugin-sourcemaps2";

export default [
    {
        input: "build/src/main.js",
        plugins: [sourcemaps()],
        output: {
            sourcemap: true,
            file: "public/dist/bundle.js",
            format: "esm",
        },
    },
    {
        input: "build/src/server/webWorkerServer.js",
        plugins: [sourcemaps()],
        output: {
            sourcemap: true,
            file: "public/dist/server/webWorkerServer.js",
            format: "esm",
        },
    },
];
