import {
    Bounds,
    boundsOverlap,
    getAllPositionsBoundsFitWithinBounds,
    pointWithinBounds,
    sizeOfBounds,
} from "../../../common/bounds.js";
import { Direction } from "../../../common/direction.js";
import { encodePosition, Point } from "../../../common/point.js";
import { QuadTree } from "../../../common/structure/quadtree.js";
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
    private _itemsTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
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
        const size = sizeOfBounds(candidate);
        const items = this._itemsTree.query({
            x: candidate.x1,
            y: candidate.y1,
            width: size.x,
            height: size.y,
        });
        return items.length == 0;
    }

    isPointAvailable(point: Point): boolean {
        return this._availablePoints.contains(encodePosition(point.x, point.y));
    }

    setItem(item: BiomeMapItem) {
        this._items.push(item);
        this._itemsTree.insert({
            x: item.point.x,
            y: item.point.y,
            width: item.size.x,
            height: item.size.y,
        });
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
