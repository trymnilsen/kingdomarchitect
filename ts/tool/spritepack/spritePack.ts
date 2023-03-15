import { existsSync } from "fs";
import * as fs from "fs/promises";
import { MaxRectsPacker } from "maxrects-packer";
import { NdArray } from "ndarray";
import * as path from "path";
import { removeItem } from "../../src/common/array";
import { BitmapImage } from "./bitmapImage";
import { getPixelsAsync, PixelColor } from "./pixels";

const assetPath = path.join(process.cwd(), "asset");

run();

async function run() {
    const files = await fs.readdir(assetPath);
    const assetFiles = files.filter((filename) => filename.endsWith(".png"));
    const definitionFiles = files.filter((filename) =>
        filename.endsWith(".json")
    );

    if (definitionFiles.length > 0) {
        await fs.mkdir(path.join("build", "sprites"), { recursive: true });
    }

    //Keep track of all sprites that we should attempt to pack in the end
    const secondPassSpriteDefinitions: PackableSprite[] = [];
    for (const definitionFile of definitionFiles) {
        //Get the path of the related png for this definition file
        const defintionPath = path.join(assetPath, definitionFile);
        const sourceFile = definitionFile.replace(".json", "") + ".png";
        const sourceFilePath = path.join(assetPath, sourceFile);
        //Create a sprite sheet of just the defined sprites, this will remove
        //any parts of the original spritesheet that is not used
        const createdSprites = await createSpriteSheet(
            defintionPath,
            sourceFilePath
        );
        if (createdSprites) {
            if (createdSprites.length == 0) {
                console.error(
                    `No sprites created for: ${sourceFilePath}`,
                    createdSprites
                );
            }
            for (const sprite of createdSprites) {
                secondPassSpriteDefinitions.push(sprite);
            }

            // Remove the inital spritesheet file and add the newly created
            // spritesheet
            removeItem(assetFiles, sourceFile);
        } else {
            console.error(`Failed creating spritesheet: ${definitionFile}`);
        }
    }

    // generate sprite definitions of all the standalone png files
    // these are considered to be a single frame
    for (const assetFile of assetFiles) {
        const assetPath = path.join(process.cwd(), "asset", assetFile);
        const pixelData = await getPixelsAsync(assetPath);
        const spriteName = assetFile.replace(".png", "");
        const width = pixelData.shape[0];
        const height = pixelData.shape[1];

        secondPassSpriteDefinitions.push({
            filename: assetPath,
            spriteName: spriteName,
            definition: {
                x: 0,
                y: 0,
                w: width,
                h: height,
                frames: 1,
            },
        });
    }

    await packSprites(secondPassSpriteDefinitions);
}

async function packSprites(sprites: PackableSprite[]) {
    const options = {
        smart: true,
        pot: false,
        square: false,
        allowRotation: false,
        tag: false,
        border: 0,
    };

    const packer = new MaxRectsPacker(1024, 1024, 0, options);
    for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        //Index is used as data
        packer.add(sprite.definition.w, sprite.definition.h, i);
    }
    const binNames: { [name: string]: string } = {};
    const packedSprites: { [name: string]: PackedSprite } = {};

    //Loop over all bins and rects and output sheets
    for (let binIndex = 0; binIndex < packer.bins.length; binIndex++) {
        const bin = packer.bins[binIndex];
        const bitmap = new BitmapImage(bin.width, bin.height);
        await bitmap.create();
        // Loop over the packed rectangles and find the frame they are tied to
        // look up the pixel in the source image based on the frame and write
        // it to the new sheet with the position of the packed rectangle
        for (const rect of bin.rects) {
            const packedSprite = sprites[rect.data];
            const spritePixels = await getPixelsAsync(packedSprite.filename);
            if (!spritePixels) {
                throw new Error(
                    `Unable to get pixels from ${packedSprite.filename}`
                );
            }

            packedSprites[packedSprite.spriteName] = {
                bin: binIndex.toString(),
                defintion: {
                    frames: packedSprite.definition.frames,
                    w: packedSprite.definition.w,
                    h: packedSprite.definition.h,
                    x: rect.x,
                    y: rect.y,
                },
            };

            for (let x = 0; x < rect.width; x++) {
                for (let y = 0; y < rect.height; y++) {
                    const xInSourceImage = packedSprite.definition.x + x;
                    const yInSourceImage = packedSprite.definition.y + y;

                    const pixel: PixelColor = {
                        red: spritePixels.get(
                            xInSourceImage,
                            yInSourceImage,
                            0
                        ),
                        green: spritePixels.get(
                            xInSourceImage,
                            yInSourceImage,
                            1
                        ),
                        blue: spritePixels.get(
                            xInSourceImage,
                            yInSourceImage,
                            2
                        ),
                        alpha: spritePixels.get(
                            xInSourceImage,
                            yInSourceImage,
                            3
                        ),
                    };
                    try {
                        bitmap.setPixel(rect.x + x, rect.y + y, pixel);
                    } catch (err) {
                        console.log("Packed rectangle", rect);
                        console.log("Related sprite", packedSprite);
                        console.log(
                            "Pixel data",
                            spritePixels.shape[0],
                            spritePixels.shape[1]
                        );
                        console.log(
                            "Error setting pixel",
                            x,
                            y,
                            xInSourceImage,
                            yInSourceImage,
                            pixel
                        );
                        console.error("Error: ", err);
                        throw err;
                    }
                }
            }
        }

        const binName = `bin-${binIndex}.png`;
        binNames[binIndex.toString()] = binName;
        await bitmap.write(
            path.join(process.cwd(), "public", "asset", binName)
        );
    }

    // Write all sprites to json
    await fs.writeFile(
        path.join(process.cwd(), "ts", "generated", "sprites.ts"),
        "export const sprites = " + JSON.stringify(packedSprites, null, 2)
    );
}

/**
 * Read a given json file with possibly many sprite definitions and read the
 * pixels of the related png file. Then generate separate sprite sheets for
 * each definition in the sprite sheet.
 * @param definitionFileName name of the json file containing sprite definitions
 * @returns
 */
async function createSpriteSheet(
    definitionPath: string,
    spritePath: string
): Promise<PackableSprite[] | null> {
    const definitionFileContent = await fs.readFile(definitionPath, {
        encoding: "utf8",
    });

    if (!existsSync(spritePath)) {
        console.error(`Sprite does not exist ${spritePath}`);
        return null;
    }

    let spriteDefinitions: { [name: string]: SpriteDefinition } = {};
    try {
        spriteDefinitions = JSON.parse(definitionFileContent);
    } catch (err) {
        console.error(`Unable to parse ${definitionPath}`, err);
        return null;
    }

    const packedSprites: PackableSprite[] = [];

    for (const spriteDefinitionEntry of Object.entries(spriteDefinitions)) {
        const pixelData = await getPixelsAsync(spritePath);
        const spriteDefinition = spriteDefinitionEntry[1];
        const spriteName = spriteDefinitionEntry[0];

        const width = pixelData.shape[0];
        const height = pixelData.shape[1];
        const definitionMaxX = spriteDefinition.x + spriteDefinition.w;
        const definitionMaxY = spriteDefinition.y + spriteDefinition.h;

        if (definitionMaxX > width) {
            console.error(
                `Sprite definition (${spriteName}) width overflow`,
                definitionMaxX,
                width
            );
            return null;
        }

        if (definitionMaxY > height) {
            console.error(
                `Sprite definition (${spriteName}) height overflow`,
                definitionMaxY,
                height
            );
            return null;
        }

        try {
            const packableSprite = await extractSprite(
                spriteName,
                spriteDefinition,
                pixelData
            );
            packedSprites.push(packableSprite);
        } catch (err) {
            console.error(`Failed to extract ${spriteName}`, err);
        }
    }

    return packedSprites;
}

async function extractSprite(
    spriteName: string,
    spriteDefinition: SpriteDefinition,
    spritePixels: NdArray<Uint8Array>
): Promise<PackableSprite> {
    const options = {
        smart: false,
        pot: false,
        square: false,
        allowRotation: false,
        tag: false,
        border: 0,
    };

    const frames = getSpriteFrames(spriteDefinition);

    const packer = new MaxRectsPacker(
        spriteDefinition.w * frames.length,
        spriteDefinition.h,
        0,
        options
    );

    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        //Add the frame to the packer. The last argument is data passed on
        //so that we later can look up which frame the packed
        //rectangle is related to
        packer.add(frame.w, frame.h, i);
    }

    if (packer.bins.length > 1) {
        throw new Error(
            `Failed to pack ${spriteName}, got ${packer.bins.length} bins`
        );
    }

    const bin = packer.bins[0];
    const bitmap = new BitmapImage(bin.width, bin.height);
    await bitmap.create();
    // Loop over the packed rectangles and find the frame they are tied to
    // look up the pixel in the source image based on the frame and write it
    // to the new sheet with the position of the packed rectangle
    for (const packedRectangle of bin.rects) {
        const packedFrame = frames[packedRectangle.data];
        for (let x = 0; x < packedRectangle.width; x++) {
            for (let y = 0; y < packedRectangle.height; y++) {
                const xInSourceImage = packedFrame.x + x;
                const yInSourceImage = packedFrame.y + y;

                const pixel: PixelColor = {
                    red: spritePixels.get(xInSourceImage, yInSourceImage, 0),
                    green: spritePixels.get(xInSourceImage, yInSourceImage, 1),
                    blue: spritePixels.get(xInSourceImage, yInSourceImage, 2),
                    alpha: spritePixels.get(xInSourceImage, yInSourceImage, 3),
                };

                bitmap.setPixel(
                    packedRectangle.x + x,
                    packedRectangle.y + y,
                    pixel
                );
            }
        }
    }

    const filename = path.join(
        process.cwd(),
        "build",
        "sprites",
        `${spriteName}.png`
    );
    await bitmap.write(filename);

    return {
        spriteName: spriteName,
        filename: filename,
        definition: {
            w: bin.width,
            h: bin.height,
            x: 0,
            y: 0,
            frames: frames.length,
        },
    };
}

function getSpriteFrames(spriteDefinition: SpriteDefinition): Rectangle[] {
    const frames: Rectangle[] = [];
    frames.push(spriteDefinition);
    const numberOfFrames = spriteDefinition.frames;
    if (numberOfFrames && numberOfFrames > 1) {
        for (let i = 1; i < numberOfFrames; i++) {
            frames.push({
                x: spriteDefinition.x + spriteDefinition.w * i,
                y: spriteDefinition.y,
                w: spriteDefinition.w,
                h: spriteDefinition.h,
            });
        }
    }

    return frames;
}

type Rectangle = {
    x: number;
    y: number;
    w: number;
    h: number;
};

type PackableSprite = {
    filename: string;
    spriteName: string;
    definition: SpriteDefinition;
};

type PackedSprite = {
    defintion: SpriteDefinition;
    bin: string;
};

interface SpriteDefinition extends Rectangle {
    frames: number;
}