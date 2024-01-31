import { PNG } from "pngjs";
import { createWriteStream } from "fs";
import { PixelColor } from "./spritepack/pixels.js";
import { createPng } from "./spritepack/pngHelper.js";

export class BitmapImage {
    private image: PNG;

    constructor(
        private width: number,
        private height: number,
    ) {
        this.image = createPng(width, height);
    }

    setPixel(x: number, y: number, pixel: PixelColor) {
        const idx = (this.image.width * y + x) << 2;
        this.image.data[idx] = pixel.red; // red
        this.image.data[idx + 1] = pixel.green; // green
        this.image.data[idx + 2] = pixel.blue; // blue
        this.image.data[idx + 3] = pixel.alpha; // alpha (0 is transparent)
    }

    write(filename: string): Promise<void> {
        const writeStream = this.image.pack().pipe(createWriteStream(filename));
        return new Promise((resolve, reject) => {
            writeStream.on("close", () => {
                resolve();
            });
            writeStream.on("error", (e: unknown) => {
                reject(e);
            });
        });
    }
}
