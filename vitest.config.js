import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["ts/test/**/*.test.ts"],
        coverage: {
            provider: "v8",
        },
    },
});
