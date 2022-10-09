module.exports = {
    moduleFileExtensions: ["ts", "tsx", "js"],
    roots: ["<rootDir>/ts/test"],
    transform: {
        "\\.(ts|tsx)$": "ts-jest",
    },
    testRegex: ".*Test.(ts|tsx|js)$",
};
