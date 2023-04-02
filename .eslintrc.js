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
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["tsconfig.json"],
        sourceType: "module",
    },
    ignorePatterns: [
        ".eslintrc.js",
        "/ts/generated/**/*",
        "/lib/**/*", // Ignore built files.
    ],
    plugins: ["@typescript-eslint", "eslint-plugin-tsdoc"],
    rules: {
        indent: ["error", 4, { SwitchCase: 1 }],
        "no-invalid-this": 0,
        "object-curly-spacing": 0,
        "new-cap": 0,
        indent: 0,
        "spaced-comment": 0,
        "no-extra-boolean-cast": 0,
        "max-len": [
            "error",
            {
                code: 80,
                ignoreTemplateLiterals: true,
                ignoreStrings: true,
                ignoreUrls: true,
            },
        ],
        "no-empty-function": "off",
        "@typescript-eslint/no-empty-function": [
            "error",
            {
                allow: ["methods", "constructors"],
            },
        ],
        "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-this-alias": 0,
        "no-constant-condition": ["error", { checkLoops: false }],
        "no-unused-vars": "off",
        "no-inferrable-types": 0,
        quotes: ["error", "double", { allowTemplateLiterals: true }],
        "prefer-promise-reject-errors": 0,
        camelcase: 0,
    },
};
