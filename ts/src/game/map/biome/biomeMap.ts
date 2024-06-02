import {
    Bounds,
    boundsOverlap,
    getAllPositionsBoundsFitWithinBounds,
    pointWithinBounds,
} from "../../../common/bounds.js";
import { Direction } from "../../../common/direction.js";
import { Point } from "../../../common/point.js";
import { Entity } from "../../entity/entity.js";
import { BiomeType } from "./biome.js";
import { BiomeMapCollection } from "./biomeMapCollection.js";

export type BiomeMapItemEntityFactory = (
    item: BiomeMapItem,
    biome: BiomeMap,
    allBiomes: BiomeMapCollection,
    rootEntity: Entity,
) => void;

export interface BiomeMapItem {
    point: Point;
    size: Point;
    name: string;
    factory: BiomeMapItemEntityFactory;
}

export type ConnectionPoints = {
    left: number[];
    right: number[];
    up: number[];
    down: number[];
};

export class BiomeMap {
    private _items: BiomeMapItem[] = [];
    private _connectionPoints: ConnectionPoints = {
        left: [],
        right: [],
        up: [],
        down: [],
    };

    private _point: Point;
    private _type: BiomeType;

    public get items(): ReadonlyArray<BiomeMapItem> {
        return this._items;
    }

    public get point(): Readonly<Point> {
        return this._point;
    }

    public get connectionPoints(): Readonly<ConnectionPoints> {
        return this._connectionPoints;
    }

    public get type(): Readonly<BiomeType> {
        return this._type;
    }

    constructor(point: Point, type: BiomeType) {
        this._point = point;
        this._type = type;
    }

    getConectionPointsForEdge(
        edge: keyof ConnectionPoints,
    ): ReadonlyArray<number> {
        return this._connectionPoints[edge];
    }

    addConnectionPoint(offset: number, direction: Direction) {
        switch (direction) {
            case Direction.Left:
                this._connectionPoints.left.push(offset);
                break;
            case Direction.Right:
                this._connectionPoints.right.push(offset);
                break;
            case Direction.Up:
                this._connectionPoints.up.push(offset);
                break;
            case Direction.Down:
                this._connectionPoints.down.push(offset);
                break;
        }
    }

    getAvailableSpots(sizeToPlace: Point): Bounds[] {
        return getAllPositionsBoundsFitWithinBounds(
            {
                x: 32,
                y: 32,
            },
            sizeToPlace,
            (candidate) => this.isSpotAvailable(candidate),
        );
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

    isPointAvailable(point: Point): boolean {
        return !this._items.some((biomeItem) => {
            const itemBounds: Bounds = {
                x1: biomeItem.point.x,
                y1: biomeItem.point.y,
                x2: biomeItem.point.x + biomeItem.size.x,
                y2: biomeItem.point.y + biomeItem.size.y,
            };

            return pointWithinBounds(point, itemBounds);
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
