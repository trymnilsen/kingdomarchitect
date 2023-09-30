module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
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
    },
};
