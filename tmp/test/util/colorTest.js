"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("../../src/util/color");
describe("color", () => {
    it("encodes color", () => {
        expect(color_1.rgbToHex(0, 0, 0)).toBe("#000000");
    });
});
//# sourceMappingURL=colorTest.js.map