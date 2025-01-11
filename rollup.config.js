import { defineConfig } from "rollup";
import sourcemaps from "@edugis/rollup-plugin-sourcemaps";

export default defineConfig({
    input: "build/src/main.js",
    output: {
        sourcemap: true,
        file: "public/dist/bundle.js",
        format: "iife",
    },
});
