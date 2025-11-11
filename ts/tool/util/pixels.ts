export interface PixelColor {
    /**
     * Red color component, number from 0 to 255
     */
    red: number;
    /**
     * Green color component, number from 0 to 255
     */
    green: number;
    /**
     * Blue color component, number from 0 to 255
     */
    blue: number;
    /**
     * Alpha color component, number from 0 to 255
     */
    alpha: number;
}

export function hexToRgb(hex: string): PixelColor {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!!result) {
        return {
            red: parseInt(result[1], 16),
            green: parseInt(result[2], 16),
            blue: parseInt(result[3], 16),
            alpha: 255,
        };
    } else {
        throw new Error(`Color not valid ${hex}`);
    }
}
