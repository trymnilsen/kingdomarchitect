import * as path from "path";
import * as fs from "fs/promises";
import Jimp from "jimp";
import getPixels from "get-pixels";
import { NdArray } from "ndarray";
import { MaxRectsPacker } from "maxrects-packer";

type BinRect = { x: number; y: number; w: number; h: number };
const assetPath = path.join(process.cwd(), "asset");
//load files in assets
const images: { [id: string]: NdArray<Uint8Array> } = {};
processFiles();

async function processFiles() {
    const files = await fs.readdir(assetPath);
    const options = {
        smart: true,
        pot: true,
        square: false,
        allowRotation: false,
        tag: false,
        border: 0,
    };
    const packer = new MaxRectsPacker(1024, 1024, 0, options);
    const input: { [id: string]: BinRect } = {};

    for (const file of files) {
        try {
            const pixelData = await getPixelsAsync(path.join(assetPath, file));
            images[file] = pixelData;
            const width = pixelData.shape[0];
            const height = pixelData.shape[1];
            packer.add(width, height, file);
        } catch (err) {
            console.error(`failed to get pixels for ${file}`);
        }
    }

    for (let binIndex = 0; binIndex < packer.bins.length; binIndex++) {
        const bin = packer.bins[binIndex];
        let image = await createImage(bin.width, bin.height);
        for (const rect of bin.rects) {
            const pixelData = images[rect.data];
            input[rect.data] = {
                x: rect.x,
                y: rect.y,
                w: rect.width,
                h: rect.height,
            };

            for (let x = 0; x < rect.width; x++) {
                for (let y = 0; y < rect.height; y++) {
                    const pixel = {
                        r: pixelData.get(x, y, 0),
                        g: pixelData.get(x, y, 1),
                        b: pixelData.get(x, y, 2),
                        a: pixelData.get(x, y, 3),
                    };
                    const color = Jimp.rgbaToInt(
                        pixel.r,
                        pixel.g,
                        pixel.b,
                        pixel.a
                    );

                    image.setPixelColor(color, rect.x + x, rect.y + y);
                }
            }
        }

        await image.writeAsync(
            path.join(assetPath, "..", `sprites-${binIndex}.png`)
        );
    }

    const jsonText = JSON.stringify(input);
    await fs.writeFile(path.join(assetPath, "..", `sprites.json`), jsonText);
}
//v2 read json files from existing spritesheets
//get size
//binpack
//readpixels
//writetopng
//writejson

function createImage(width: number, height: number): Promise<Jimp> {
    return new Promise((resolve, reject) => {
        new Jimp(width, height, (err, image) => {
            if (!!err) {
                reject(err);
            } else {
                resolve(image);
            }
        });
    });
}

async function getPixelsAsync(path: string): Promise<NdArray<Uint8Array>> {
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
