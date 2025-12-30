import { Point } from "../../../../common/point.ts";

export type Graph = {
    nodeAt(x: number, y: number): GraphNode | null;
    cleanDirtyNodes(): void;
    markDirtyNode(point: GraphNode): void;
    neighbors(point: GraphNode): GraphNode[];
    invalidatePoint(point: Point): void;
    getNodes(): GraphNode[];
    readonly offsetX: number;
    readonly offsetY: number;
};

export class GraphNode {
    private _x: number;
    private _y: number;
    /**
     * A weight of 0 denotes a wall.
     * A weight cannot be negative.
     * A weight cannot be between 0 and 1 (exclusive).
     * A weight can contain decimal values (greater than 1).
     */
    private _weight: number;

    f: number;
    g: number;
    h: number;
    visited: boolean;
    closed: boolean;
    parent: GraphNode | null;
    isDirty: boolean;

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get weight(): number {
        return this._weight;
    }

    get isWall(): boolean {
        return this.weight == 0;
    }

    constructor(x: number, y: number, weight: number) {
        if (weight < 0 || (weight > 0 && weight < 1)) {
            console.warn(`Invalid weight for node`, {
                x,
                y,
                weight,
            });
            weight = 0;
        }

        this.isDirty = false;
        this._weight = weight;
        this._x = x;
        this._y = y;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }

    clean() {
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.isDirty = false;
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }
}
