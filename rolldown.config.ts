import { defineConfig } from "rolldown";

export default defineConfig({
    input: "ts/src/main.ts",
    output: {
        sourcemap: true,
        file: "public/dist/bundle.js",
    },
});
