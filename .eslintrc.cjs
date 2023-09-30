module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    root: true,
    rules: {
        "@typescript-eslint/no-unused-vars": [
            "off",
            { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/explicit-member-accessibility": [
            "error",
            {
                accessibility: "no-public",
            },
        ],
        "@typescript-eslint/no-extraneous-class": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-mixed-enums": "error",
        "@typescript-eslint/triple-slash-reference": "error",
        "@typescript-eslint/unbound-method": "error",
        "@typescript-eslint/restrict-template-expressions": "error",
        "@typescript-eslint/prefer-string-starts-ends-with": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-includes": "error",
    },
};
