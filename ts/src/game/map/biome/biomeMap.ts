import { Bounds, boundsOverlap } from "../../../common/bounds.js";
import { Point } from "../../../common/point.js";
import { Entity } from "../../entity/entity.js";
import { BiomeType } from "./biome.js";

export class BiomeMap {
    private _items: BiomeMapItem[] = [];
    private _point: Point;
    private _type: BiomeType;

    public get items(): ReadonlyArray<BiomeMapItem> {
        return this._items;
    }

    public get point(): Readonly<Point> {
        return this._point;
    }

    public get type(): Readonly<BiomeType> {
        return this._type;
    }

    constructor(point: Point, type: BiomeType) {
        this._point = point;
        this._type = type;
    }

    isSpotAvailable(candidate: Bounds): boolean {
        // If there is any items that overlap with the candidate, the position is
        // not available
        return !this._items.some((biomeItem) => {
            const itemBounds: Bounds = {
                x1: biomeItem.point.x,
                y1: biomeItem.point.y,
                x2: biomeItem.point.x + biomeItem.size.x,
                y2: biomeItem.point.y + biomeItem.size.y,
            };
            return boundsOverlap(itemBounds, candidate);
        });
    }

    setItem(item: BiomeMapItem) {
        this._items.push(item);
    }

    worldPosition(item: BiomeMapItem): Point {
        return {
            x: item.point.x + this._point.x * 32,
            y: item.point.y + this._point.y * 32,
        };
    }
}

export type BiomeMapItemEntityFactory = (
    item: BiomeMapItem,
    biome: BiomeMap,
    allMaps: ReadonlyArray<BiomeMap>,
    rootEntity: Entity,
) => void;

export interface BiomeMapItem {
    point: Point;
    size: Point;
    name: string;
    factory: BiomeMapItemEntityFactory;
}
