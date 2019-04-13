import { rgbToHex } from "../../src/common/color";

describe("color", () => {
    it("encodes color", () => {
        expect(rgbToHex(0, 0, 0)).toBe("#000000");
    });
});
