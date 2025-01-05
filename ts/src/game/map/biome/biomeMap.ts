import { randomEntry } from "../../../common/array.js";
import {
    Bounds,
    boundsOverlap,
    pointWithinBounds,
    sizeOfBounds,
} from "../../../common/bounds.js";
import { Direction } from "../../../common/direction.js";
import { encodePosition, Point } from "../../../common/point.js";
import {
    placeWithTilesplit,
    QuadTree,
} from "../../../common/structure/quadtree.js";
import {
    Rectangle,
    splitRectangle,
} from "../../../common/structure/rectangle.js";
import { SparseSet } from "../../../common/structure/sparseSet.js";
import { Entity } from "../../entity/entity.js";
import { Tileset, TilesetVariant } from "../tileset.js";
import { BiomeType } from "./biome.js";
import { BiomeMapCollection } from "./biomeMapCollection.js";

export type BiomeMapItemEntityFactory = (
    item: BiomeMapItem,
    biome: BiomeMap,
    allBiomes: BiomeMapCollection,
    rootEntity: Entity,
) => void;

export interface PlaceableItem {
    size?: Point;
    name: string;
    factory: BiomeMapItemEntityFactory;
}

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

    private _itemsTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
    private _freeSpace = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
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
        this._freeSpace.insert({ x: 0, y: 0, width: 32, height: 32 });
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

    /*
    isSpotAvailable(candidate: Bounds): boolean {
        const size = sizeOfBounds(candidate);
        const results = this._itemsTree.query({
            x: candidate.x1,
            y: candidate.y1,
            width: size.x,
            height: size.y,
        });

        return results.length > 0;
    }*/

    placeItems(item: PlaceableItem, amount: number) {
        if (amount < 1) {
            return;
        }
        for (let i = 0; i < amount; i++) {
            const couldPlace = this.placeItem(item);
            if (!couldPlace) {
                break;
            }
        }
    }

    placeItemWithPosition(item: Required<PlaceableItem>, position: Point) {
        const rectangleToPlace = {
            x: position.x,
            y: position.y,
            width: item.size.x,
            height: item.size.y,
        };
        const currentSpaces = this._freeSpace.query(rectangleToPlace);

        for (const space of currentSpaces) {
            this._freeSpace.delete(space);
            //Split the rectangle
            const splits = splitRectangle(space, rectangleToPlace);
            //add the split rectangles into the quadtree
            for (let i = 0; i < splits.length; i++) {
                this._freeSpace.insert(splits[i]);
            }
        }

        this.setItem({
            name: item.name,
            factory: item.factory,
            point: position,
            size: item.size,
        });
    }

    placeItem(item: PlaceableItem): Rectangle | null {
        const width = item.size?.x ?? 1;
        const height = item.size?.y ?? 1;
        const position = placeWithTilesplit(this._freeSpace, width, height);

        if (!!position) {
            const point = this.setItem({
                name: item.name,
                point: { x: position.x, y: position.y },
                size: { x: width, y: height },
                factory: item.factory,
            });
            return {
                width: width,
                height: height,
                x: position.x,
                y: position.y,
            };
        } else {
            return null;
        }
    }

    placeTileset(
        tileset: Tileset,
        factory: (tileset: TilesetVariant) => BiomeMapItemEntityFactory,
    ): Bounds | null {
        let availableVariants = tileset.variants;
        while (availableVariants.length > 0) {
            const variant = randomEntry(availableVariants);
            const size = {
                x: variant.width,
                y: variant.height,
            };
            console.log("tileset", tileset.name);
            console.count("placeTileset");

            const position = placeWithTilesplit(
                this._freeSpace,
                size.x,
                size.y,
            );
            if (!!position) {
                this.setItem({
                    name: tileset.name,
                    point: { x: position.x, y: position.y },
                    size: size,
                    factory: factory(variant),
                });

                return {
                    x1: position.x,
                    y1: position.y,
                    x2: position.x + size.x,
                    y2: position.y + size.y,
                };
            } else {
                //Filter out this variant, we can also filter out items that are
                //larger in both width and height
                availableVariants = availableVariants.filter((item) => {
                    const isLarger =
                        item.width >= variant.width &&
                        item.height >= variant.height;

                    return !isLarger;
                });
            }
        }

        // Got here? No variants available
        console.log(
            `No variant for ${tileset.name} found that fits available space for in ${this.type} at`,
            this.point,
        );

        return null;
    }

    worldPosition(item: BiomeMapItem): Point {
        return {
            x: item.point.x + this._point.x * 32,
            y: item.point.y + this._point.y * 32,
        };
    }

    private setItem(item: BiomeMapItem) {
        this._items.push(item);
        this._itemsTree.insert({
            x: item.point.x,
            y: item.point.y,
            width: item.size.x,
            height: item.size.y,
        });
    }
}
