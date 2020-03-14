"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function numToHex(num) {
    let hex = Number(num).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}
function rgbToHex(r, g, b) {
    const red = numToHex(r);
    const green = numToHex(g);
    const blue = numToHex(b);
    return "#" + red + green + blue;
}
exports.rgbToHex = rgbToHex;
//# sourceMappingURL=color.js.map