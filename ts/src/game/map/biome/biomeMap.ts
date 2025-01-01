import {
    Bounds,
    boundsOverlap,
    getAllPositionsBoundsFitWithinBounds,
    pointWithinBounds,
    sizeOfBounds,
} from "../../../common/bounds.js";
import { Direction } from "../../../common/direction.js";
import { encodePosition, Point } from "../../../common/point.js";
import { SparseSet } from "../../../common/structure/sparseSet.js";
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

    private _availablePoints = new SparseSet<number>();
    private _point: Point;
    private _type: BiomeType;

    public get availablePoints(): SparseSet<number> {
        return this._availablePoints;
    }

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
        for (let x = 0; x < 32; x++) {
            for (let y = 0; y < 32; y++) {
                this._availablePoints.add(encodePosition(x, y));
            }
        }
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
        // Do a quick first pass
        const firstPoint = encodePosition(candidate.x1, candidate.y1);
        if (!this._availablePoints.contains(firstPoint)) {
            return false;
        }

        const size = sizeOfBounds(candidate);
        for (let x = 0; x < size.x; x++) {
            const cx = candidate.x1 + x;
            for (let y = 0; y < size.y; y++) {
                const cy = candidate.y1 + y;
                // If the point is not available we can return early
                if (!this._availablePoints.contains(encodePosition(cx, cy))) {
                    return false;
                }
            }
        }

        return true;
    }

    isPointAvailable(point: Point): boolean {
        return this._availablePoints.contains(encodePosition(point.x, point.y));
    }

    setItem(item: BiomeMapItem) {
        this._items.push(item);
        for (let x = 0; x < item.size.x; x++) {
            const ix = item.point.x + x;
            for (let y = 0; y < item.size.y; y++) {
                const iy = item.point.y + y;
                this._availablePoints.delete(encodePosition(ix, iy));
            }
        }
    }

    worldPosition(item: BiomeMapItem): Point {
        return {
            x: item.point.x + this._point.x * 32,
            y: item.point.y + this._point.y * 32,
        };
    }
}
