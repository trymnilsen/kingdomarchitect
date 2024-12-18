import { Point } from "../../../common/point.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";
import { BiomeType } from "../../map/biome/biome.js";

export type TileEntry = {
    x: number;
    y: number;
    type: BiomeType;
};

export class TileComponent extends EcsComponent {
    tiles: Record<string, TileEntry> = {};

    getTile(x: number, y: number) {
        return this.tiles[tileId(x, y)];
    }
}

export function tileId(x: number, y: number) {
    return x + ":" + y;
}
