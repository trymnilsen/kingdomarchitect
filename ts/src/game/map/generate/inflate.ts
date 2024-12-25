import { addPoint, Point } from "../../../common/point.js";
import { EcsWorldScope, RootEntity } from "../../../ecs/ecsWorldScope.js";
import { TileComponent } from "../../ecsComponent/world/tileComponent.js";
import { BiomeType } from "../biome/biome.js";
import { BiomeMap } from "../biome/biomeMap.js";
import { BiomeMapCollection } from "../biome/biomeMapCollection.js";
import { TileSize } from "../tile.js";
import { generateDesertBiome } from "./desert.js";
import { generateForrestBiome } from "./forrest.js";
import { generateSnowBiome } from "./snow.js";

export function inflateBiome(
    biomeMap: BiomeMap,
    chunkPosition: Point,
    world: EcsWorldScope,
) {
    let tileComponent = world.components.getComponent(
        RootEntity,
        TileComponent,
    );

    if (!tileComponent) {
        tileComponent = new TileComponent();
        world.addComponent(RootEntity, tileComponent);
    }

    const startPosition: Point = {
        x: chunkPosition.x * TileSize,
        y: chunkPosition.y * TileSize,
    };

    //Loop over and add tiles
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            tileComponent.setTile(
                startPosition.x + x,
                startPosition.y + y,
                biomeMap.type,
            );
        }
    }

    //Generate biome items
    switch (biomeMap.type) {
        case "desert":
            generateDesertBiome(biomeMap);
            break;
        case "forrest":
            generateForrestBiome(biomeMap);
            break;
        case "snow":
            generateSnowBiome(biomeMap);
            break;
        case "swamp":
            break;
        default:
            break;
    }

    for (const item of biomeMap.items) {
        item.factory(item, biomeMap, new BiomeMapCollection([]), world);
    }
}
