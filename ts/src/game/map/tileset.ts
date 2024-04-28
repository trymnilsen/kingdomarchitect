import { Point } from "../../common/point.js";

export type TilesetVariant = {
    width: number;
    height: number;
    variant: number;
    entities: { position: Point; id: string }[];
};

export type Tileset = {
    name: string;
    variants: TilesetVariant[];
};

export function getLargestSize(tileset: Tileset): Point {
    return tileset.variants.reduce(
        (largest, current) => {
            if (current.width > largest.x) {
                largest.x = current.width;
            }

            if (current.height > largest.y) {
                largest.y = current.height;
            }

            return largest;
        },
        { x: 0, y: 0 },
    );
}
