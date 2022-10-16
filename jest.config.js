module.exports = {
    moduleFileExtensions: ["ts", "tsx", "js"],
    roots: ["<rootDir>/ts/test"],
    reporters: ["jest-progress-bar-reporter"],
    transform: {
        "\\.(ts|tsx)$": "ts-jest",
    },
    testRegex: ".*Test.(ts|tsx|js)$",
};
