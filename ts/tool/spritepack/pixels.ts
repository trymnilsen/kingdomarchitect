import getPixels from "get-pixels";
import { NdArray } from "ndarray";

export async function getPixelsAsync(
    path: string
): Promise<NdArray<Uint8Array>> {
    return new Promise((resolve, reject) => {
        getPixels(path, (error, pixels) => {
            if (!!error) {
                reject(error);
            } else {
                resolve(pixels);
            }
        });
    });
}

export interface PixelColor {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}
