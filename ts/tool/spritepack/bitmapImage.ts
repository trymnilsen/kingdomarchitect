import Jimp from "jimp";
import { PixelColor } from "./pixels.js";

export class BitmapImage {
    private image: Jimp | undefined;

    constructor(private width: number, private height: number) {}

    async create() {
        const createPromise = new Promise<Jimp>((resolve, reject) => {
            new Jimp(this.width, this.height, (err, image) => {
                if (!!err) {
                    reject(err);
                } else {
                    resolve(image);
                }
            });
        });

        this.image = await createPromise;
    }

    setPixel(x: number, y: number, pixel: PixelColor) {
        const color = Jimp.rgbaToInt(
            pixel.red,
            pixel.green,
            pixel.blue,
            pixel.alpha
        );

        if (this.image) {
            this.image.setPixelColor(color, x, y);
        }
    }

    async write(filename: string) {
        if (this.image) {
            await this.image.writeAsync(filename);
        }
    }
}
