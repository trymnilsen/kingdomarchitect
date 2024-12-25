import { nameof } from "../../common/nameof.js";

export function getTileId(x: number, y: number) {
    return `x${x}y${y}`;
}

export const TileSize = 40;
export const HalfTileSize = TileSize / 2;

export type GroundTile = {
    tileX: number;
    tileY: number;
};

export function isTile(value: unknown): value is GroundTile {
    if (!value) {
        return false;
    }

    if (typeof value != "object") {
        return false;
    }

    return (
        nameof<GroundTile>("tileX") in value &&
        nameof<GroundTile>("tileY") in value
    );
}

function hasTree(threshold: number): number {
    if (Math.random() > threshold) {
        return Math.floor(Math.random() * 3.0) + 1;
    } else {
        return 0;
    }
}
