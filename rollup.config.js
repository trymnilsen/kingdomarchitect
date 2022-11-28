import sourcemaps from "rollup-plugin-sourcemaps";

export default {
    input: "build/src/main.js",
    plugins: [sourcemaps()],
    output: {
        sourcemap: true,
        file: "public/dist/bundle.js",
        format: "iife",
        name: "kingdomarchitect",
    },
};
