import { absBounds } from "../common/bounds";
import {
    addPoint,
    isPointAdjacentTo,
    Point,
    pointEquals,
} from "../common/point";
import { Graph, GraphNode } from "../path/graph";
import { PathSearch } from "../path/search";
import { RenderContext } from "../rendering/renderContext";
import { JobQueue } from "./actor/job/jobQueue";
import { Actors } from "./entity/actors";
import { KeepChildEntity, KeepEntity } from "./entity/building/keepEntity";
import { Buildings } from "./entity/buildings";
import { Entities } from "./entity/entities";
import { Ground } from "./entity/ground";
import { getTileId } from "./entity/tile";
import { getStartBuildings } from "./worldSeed";

export class World {
    private _ground: Ground;
    private _buildings: Buildings;
    private _pathSearch: PathSearch;
    private _actors: Actors;
    private _entities: Entities;

    public get graph(): Graph {
        return this._pathSearch.getGraph();
    }

    public get ground(): Ground {
        return this._ground;
    }

    public get entities(): Entities {
        return this._entities;
    }

    public get buildings(): Buildings {
        return this._buildings;
    }

    public get actors(): Actors {
        return this._actors;
    }

    public get jobQueue(): JobQueue {
        return this.actors.jobQueue;
    }

    constructor() {
        this._entities = new Entities(this);
        this._ground = new Ground();
        this._buildings = new Buildings();
        this._actors = new Actors(this);

        const startBuildings = getStartBuildings(this._ground);
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                this.ground.setTile({
                    tileX: x + 3,
                    tileY: y + 3,
                });
            }
        }
        for (const buidling of startBuildings) {
            this.ground.setTile({
                tileX: buidling.x,
                tileY: buidling.y,
            });
            this.buildings.add(buidling);
        }

        // Add the castle keep
        const keepEntityId = getTileId(3, 3);
        const keepChildEntityId: string[] = [];
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                if (x === 0 && y === 0) {
                    continue;
                }
                const keepChild = new KeepChildEntity(keepEntityId, {
                    x: x + 3,
                    y: y + 3,
                });
                const childId = getTileId(x + 3, y + 3);
                this._entities.add(keepChild);
                keepChildEntityId.push(childId);
            }
        }
        const keepEntity = new KeepEntity(keepChildEntityId, { x: 3, y: 3 });
        this._entities.add(keepEntity);

        this._pathSearch = new PathSearch(new Graph([], 0, 0));
        this.invalidateWorld();
    }

    tick(tick: number): void {
        if (tick % 5 == 0) {
            this.ground.generate();
            this.invalidateWorld();
        }
        this._actors.onUpdate(tick);
    }

    invalidateWorld() {
        this._pathSearch.updateGraph(createWeightGraphFromWorld(this));
    }

    onDraw(context: RenderContext): void {
        this.ground.onDraw(context);
        this._buildings.onDraw(context);
        this._entities.onDraw(context);
        this._actors.onDraw(context);
    }

    findPath(from: Point, to: Point, blockBuildings?: Boolean): PathResult {
        const offsetPoint = {
            x: this._pathSearch.getGraph().offsetX,
            y: this._pathSearch.getGraph().offsetY,
        };
        const offsetFrom = addPoint(from, {
            x: offsetPoint.x,
            y: offsetPoint.y,
        });
        const offsetTo = addPoint(to, {
            x: offsetPoint.x,
            y: offsetPoint.y,
        });

        // To handle cases where we want to search up until the to node
        // for example finding the route to a building but not up on the
        // building itself we will override the partial search but rememeber it.
        // Once the search is complete we check if the final position in
        // the path that has been searched is adjacent to the to point or tile
        // this adjency handles multi-tiles. I.e the points might not be adjacent
        // on a grid, but they might be considered adjacent if the to point is
        // inside a building that stretches across multiple tiles and one of the
        // tiles belonging to the building is adjacent to the last path point
        const weightModifier = !!blockBuildings
            ? blockBuildingsModifier
            : defaultWeightModifier;

        // Perform the search
        const result = this._pathSearch.search(
            offsetFrom,
            offsetTo,
            true,
            weightModifier
        );

        // The path results are returned in a absolute space, so we convert them
        // back before doing any further work on it
        const path = result.map((item) => {
            return {
                x: item.x - offsetPoint.x,
                y: item.y - offsetPoint.y,
            };
        });
        if (path.length == 0) {
            return {
                status: PathResultStatus.None,
                path: [],
            };
        }

        // Now we have a search result, check if the end of the path is adjacent
        // to the end point if needed
        const lastPathPoint = path[path.length - 1];
        if (pointEquals(lastPathPoint, to)) {
            return {
                status: PathResultStatus.Complete,
                path: path,
            };
        } else if (this.isPointAdjacent(to, lastPathPoint)) {
            return {
                status: PathResultStatus.Adjacent,
                path: path,
            };
        } else {
            return {
                status: PathResultStatus.Partial,
                path: path,
            };
        }
    }

    /**
     * Checks if the provided points are considered adjacent to eachother
     * Note that this method will return true for multitile cases even if the
     * points are not considered adjacent on a grid
     * @param a first point
     * @param b second point
     */
    private isPointAdjacent(a: Point, b: Point): Boolean {
        // First check if its adjacent on a grid
        if (isPointAdjacentTo(a, b)) {
            return true;
        }

        // It might still be adjacent if the points as within a multi-tile point
        const aTiles = this._entities.getMultiTile(
            getTileId(a.x, a.y)
        ) as Point[];
        const bTiles = this._entities.getMultiTile(
            getTileId(b.x, b.y)
        ) as Point[];

        // if there are no buildings at the given tiles we add a point to check
        // against, unless both don't have any. In this case there we have
        // checked above if the points are adjacent
        if (aTiles.length == 0 && bTiles.length == 0) {
            return false;
        }

        if (aTiles.length == 0) {
            aTiles.push(a);
        }

        if (bTiles.length == 0) {
            bTiles.push(b);
        }

        //Check if any a tiles is adjacent to any b tiles
        for (const aTile of aTiles) {
            const aTileHasAdjacentBTile = bTiles.some((bTile) =>
                isPointAdjacentTo(aTile, bTile)
            );
            // If there is an adjacent tile we return out of the for loop
            if (aTileHasAdjacentBTile) {
                return true;
            }
        }

        return false;
    }
}

export enum PathResultStatus {
    /**
     * A complete path was found including the end point
     */
    Complete = "complete",
    /**
     * A complete path was found excluding the end point
     */
    Adjacent = "adjacent",
    /**
     * A partial path was found to the end point
     */
    Partial = "partial",
    /**
     * No path was found from start to end
     */
    None = "none",
}

export interface PathResult {
    path: Point[];
    status: PathResultStatus;
}

const defaultWeightModifier = (node: GraphNode) => node.weight;
const blockBuildingsModifier = (node: GraphNode) => {
    return node.weight >= 100 ? 0 : node.weight;
};

/**
 * Creates a graph based on the given world
 * @param world
 * @returns a [Graph] based on the tiles in the world for pathfinding
 */
function createWeightGraphFromWorld(world: World): Graph {
    const bounds = world.ground.getBounds();
    const offsetBounds = absBounds(bounds);
    const weightGraph: number[][] = [];
    for (let x = 0; x <= offsetBounds.bounds.x2; x++) {
        weightGraph[x] = [];
        for (let y = 0; y <= offsetBounds.bounds.y2; y++) {
            let weight = 1000;
            const tilePositionXWithoutOffset = x - offsetBounds.offsets.x;
            const tilePositionYWithoutOffset = y - offsetBounds.offsets.y;
            const tileId = getTileId(
                tilePositionXWithoutOffset,
                tilePositionYWithoutOffset
            );
            const ground = world.ground.getTile({
                x: tilePositionXWithoutOffset,
                y: tilePositionYWithoutOffset,
            });
            if (ground) {
                if (ground.hasTree) {
                    weight = 20;
                } else {
                    weight = 5;
                }
            }
            const building = world.buildings.getTile(tileId);
            if (building) {
                weight = building.weight || 1000; //If there is a building at this position we make it very difficult to pass
            }

            const entity = world.entities.getTile({
                x: tilePositionXWithoutOffset,
                y: tilePositionYWithoutOffset,
            });
            if (!!entity) {
                weight = 500;
            }
            weightGraph[x][y] = weight;
        }
    }

    const graph = new Graph(
        weightGraph,
        offsetBounds.offsets.x,
        offsetBounds.offsets.y
    );
    return graph;
}
