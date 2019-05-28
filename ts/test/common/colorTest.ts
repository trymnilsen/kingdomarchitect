import { rgbToHex } from "../../src/util/color";

describe("color", () => {
    it("encodes color", () => {
        expect(rgbToHex(0, 0, 0)).toBe("#000000");
    });
});
