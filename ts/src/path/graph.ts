export class Graph {
    private nodes: GraphNode[];
    private grid: GraphNode[][];
    private dirtyNodes: GraphNode[];
    private _offsetX: number;
    private _offsetY: number;

    public get offsetX(): number {
        return this._offsetX;
    }

    public get offsetY(): number {
        return this._offsetY;
    }

    constructor(weights: number[][], offsetX: number, offsetY: number) {
        this.grid = [];
        this.nodes = [];
        this.dirtyNodes = [];
        this._offsetX = offsetX;
        this._offsetY = offsetY;

        for (let x = 0; x < weights.length; x++) {
            this.grid[x] = [];
            const row = weights[x];
            for (let y = 0; y < row.length; y++) {
                const weight = row[y];
                const node = new GraphNode(x, y, weight);
                this.grid[x][y] = node;
                this.nodes.push(node);
            }
        }
    }

    nodeAt(x: number, y: number): GraphNode {
        return this.grid[x][y];
    }

    cleanDirtyNodes() {
        for (const node of this.dirtyNodes) {
            node.clean();
        }
        this.dirtyNodes = [];
    }

    markDirtyNode(node: GraphNode) {
        this.dirtyNodes.push(node);
    }

    neighbors(node: GraphNode): GraphNode[] {
        var neighborNodes: GraphNode[] = [];
        var x = node.x;
        var y = node.y;

        // West
        if (this.grid[x - 1] && this.grid[x - 1][y]) {
            neighborNodes.push(this.grid[x - 1][y]);
        }

        // East
        if (this.grid[x + 1] && this.grid[x + 1][y]) {
            neighborNodes.push(this.grid[x + 1][y]);
        }

        // South
        if (this.grid[x] && this.grid[x][y - 1]) {
            neighborNodes.push(this.grid[x][y - 1]);
        }

        // North
        if (this.grid[x] && this.grid[x][y + 1]) {
            neighborNodes.push(this.grid[x][y + 1]);
        }

        return neighborNodes;
    }
}

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

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public get weight(): number {
        return this._weight;
    }

    public get isWall(): boolean {
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
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }
}
