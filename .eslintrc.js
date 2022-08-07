module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "google",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
        sourceType: "module",
    },
    ignorePatterns: [
        "/lib/**/*", // Ignore built files.
    ],
    plugins: ["@typescript-eslint", "import", "jsdoc"],
    rules: {
        indent: ["error", 4, { SwitchCase: 1 }],
        "no-invalid-this": 0,
        "object-curly-spacing": 0,
        "import/no-unresolved": 0,
        "require-jsdoc": 0,
        "jsdoc/require-description": 1,
        "jsdoc/require-param-name": 1,
        "new-cap": 0,
        "spaced-comment": 0,
        "max-len": [
            "warn",
            {
                code: 90,
                ignoreTemplateLiterals: true,
                ignoreStrings: true,
                ignoreUrls: true,
            },
        ],
        quotes: ["error", "double", { allowTemplateLiterals: true }],
        "prefer-promise-reject-errors": 0,
        "valid-jsdoc": [
            "error",
            { requireParamType: false, requireReturnType: false },
        ],
        camelcase: 0,
    },
};
