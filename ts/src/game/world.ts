import { Bounds } from "../common/bounds";
import { clone } from "../common/clone";
import { addPoint, Point } from "../common/point";
import { Graph } from "../path/graph";
import { PathSearch } from "../path/search";
import { RenderContext } from "../rendering/renderContext";
import { JobQueue } from "./actor/job/jobQueue";
import { Actors } from "./entity/actors";
import { Buildings } from "./entity/buildings";
import { Ground } from "./entity/ground";
import { getTileId } from "./entity/tile";

export class World {
    private _ground: Ground;
    private _buildings: Buildings;
    private _pathSearch: PathSearch;
    private _actors: Actors;

    public get ground(): Ground {
        return this._ground;
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
        this._ground = new Ground();
        this._buildings = new Buildings();
        this._actors = new Actors(this);
        for (let i = 0; i < 100; i++) {
            this.ground.generate();
        }

        this._pathSearch = new PathSearch(new Graph([], 0, 0));
    }

    tick(tick: number): void {
        if (tick % 5 == 0) {
            //console.log("Generate tick");
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
        this._actors.onDraw(context);
    }

    findPath(from: Point, to: Point): Point[] {
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
        const result = this._pathSearch.search(offsetFrom, offsetTo);
        return result.map((item) => {
            return {
                x: item.x - offsetPoint.x,
                y: item.y - offsetPoint.y,
            };
        });
    }
}

function absBounds(bounds: Bounds): {
    bounds: Bounds;
    offsets: Point;
} {
    const boundsDiffX = 0 - bounds.x1;
    const boundsDiffY = 0 - bounds.y1;

    return {
        bounds: {
            x1: 0,
            y1: 0,
            x2: bounds.x2 + boundsDiffX,
            y2: bounds.y2 + boundsDiffY,
        },
        offsets: {
            x: boundsDiffX,
            y: boundsDiffY,
        },
    };
}

function createWeightGraphFromWorld(world: World): Graph {
    const bounds = world.ground.getBounds();
    const offsetBounds = absBounds(bounds);
    const weightGraph: number[][] = [];
    for (let x = 0; x <= offsetBounds.bounds.x2; x++) {
        weightGraph[x] = [];
        for (let y = 0; y <= offsetBounds.bounds.y2; y++) {
            let weight = 0;
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
                    weight = 10;
                } else {
                    weight = 1;
                }
            }
            const building = world.buildings.getTile(tileId);
            if (building) {
                weight = 1000; //If there is a building at this position we make it very difficult to pass
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
