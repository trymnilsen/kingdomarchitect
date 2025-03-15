function numToHex(num: number) {
    let hex = Number(Math.min(Math.max(0, num), 255)).toString(16);
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

export function randomColor(): string {
    return rgbToHex(
        Math.floor(Math.random() * 16) * 16,
        Math.floor(Math.random() * 16) * 16,
        Math.floor(Math.random() * 16) * 16,
    );
}
