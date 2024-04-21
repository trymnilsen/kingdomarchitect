import * as fs from "fs/promises";
import * as path from "path";
import { EOL } from "os";
import { desertOasisTilesetConfig } from "./config/desertOasis.js";
import { getPixelColor, readPng } from "../spritepack/pngHelper.js";
import { rgbToHex } from "../../src/common/color.js";
import { Point } from "../../src/common/point.js";
import { desertRuinsTilesetConfig } from "./config/desertRuins.js";
import { forrestTilesetConfig } from "./config/forrests.js";
import { pondTilesetConfig } from "./config/ponds.js";
import { fortTilesetConfig } from "./config/forts.js";
import { Tileset } from "../../src/game/map/tileset.js";

const ignoredColors = ["#000000", "#FFFFFF"];

const tilePath = path.join(process.cwd(), "tileset");
export type TileConfig = {
    name: string;
    color: {
        [id: string]: string;
    };
};

async function run() {
    const files = await fs.readdir(tilePath);
    const configs: TileConfig[] = [
        desertRuinsTilesetConfig,
        desertOasisTilesetConfig,
        forrestTilesetConfig,
        pondTilesetConfig,
        fortTilesetConfig,
    ];
    const tilesets: { [id: string]: Tileset } = {};
    for (const config of configs) {
        const configFiles = files
            .map((file) => file.split("."))
            .filter((file) => file[0] == config.name)
            .map((filename) => filename.join("."));

        if (configFiles.length == 0) {
            console.log(`No tileset bitmaps for ${config.name} found`);
            continue;
        }

        const tileset: Tileset = {
            variants: [],
        };

        for (let i = 0; i < configFiles.length; i++) {
            const tileBitmapFilename = configFiles[i];
            const pngPath = path.join(tilePath, tileBitmapFilename);
            const tilemap = readPng(pngPath);
            const entities: { position: Point; id: string }[] = [];
            for (let x = 0; x < tilemap.width; x++) {
                for (let y = 0; y < tilemap.height; y++) {
                    const pixelColor = getPixelColor(tilemap, x, y);
                    const hexColor = rgbToHex(
                        pixelColor.red,
                        pixelColor.green,
                        pixelColor.blue,
                    ).toUpperCase();

                    const tileType = config.color[hexColor];
                    if (!!tileType) {
                        entities.push({
                            position: { x, y },
                            id: tileType,
                        });
                    } else {
                        if (!ignoredColors.includes(hexColor)) {
                            console.log(
                                `Color ${hexColor} at ${x}/${y} from ${tileBitmapFilename} not defined for ${config.name}`,
                                config.color,
                            );
                        }
                    }
                }
            }

            tileset.variants.push({
                width: tilemap.width,
                height: tilemap.height,
                entities: entities,
                variant: i,
            });
        }

        if (!!tilesets[config.name]) {
            console.warn(
                `A tileset with the name ${config.name} already exists. You might have a duplicate. Overwriting the previous set with this name`,
            );
        }
        tilesets[config.name] = tileset;
    }

    const tilesetsJson = JSON.stringify(tilesets, null, 2);
    const generatedTypescript = [
        "export const tilesets = " + tilesetsJson + ";",
    ].join(EOL);

    // Write all sprites to json
    await fs.writeFile(
        path.join(process.cwd(), "ts", "generated", "tilesets.ts"),
        generatedTypescript,
    );
}

run();
