function numToHex(num: number) {
    let hex = Number(num).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}
export function rgbToHex(r: number, g: number, b: number) {
    const red = numToHex(r);
    const green = numToHex(g);
    const blue = numToHex(b);
    return "#" + red + green + blue;
}
