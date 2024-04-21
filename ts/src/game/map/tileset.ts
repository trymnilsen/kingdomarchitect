import { Point } from "../../common/point.js";

export type TilesetVariant = {
    width: number;
    height: number;
    variant: number;
    entities: { position: Point; id: string }[];
};

export type Tileset = {
    variants: TilesetVariant[];
};
