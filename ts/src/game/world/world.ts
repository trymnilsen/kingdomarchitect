import { absBounds, Bounds } from "../../common/bounds";
import { generateId } from "../../common/idGenerator";
import {
    addPoint,
    isPointAdjacentTo,
    Point,
    pointEquals,
} from "../../common/point";
import { Graph, GraphNode } from "../../path/graph";
import { PathSearch } from "../../path/search";
import { RenderContext } from "../../rendering/renderContext";
import { JobQueue } from "./component/job/jobQueue";
import { JobQueueComponent } from "./component/job/jobQueueComponent";
import { createGraphFromNodes } from "./component/root/path/generateGraph";
import { PathFindingComponent } from "./component/root/path/pathFindingComponent";
import { Ground } from "./component/tile/ground";
import { TilesComponent } from "./component/tile/tilesComponent";
import { Entity } from "./entity/entity";
import { RootEntity } from "./entity/rootEntity";
import { workerPrefab } from "./prefab/workerPrefab";
import { getTileId } from "./tile/tile";

export class World {
    private _pathSearch: PathSearch;
    private _rootEntity: Entity = new RootEntity("root");

    private _groundComponent: TilesComponent;
    private _jobQueueComponent: JobQueueComponent;
    private _pathFindingComponent: PathFindingComponent;

    public get ground(): Ground {
        return this._groundComponent;
    }

    public get jobQueue(): JobQueue {
        return this._jobQueueComponent;
    }

    public get rootEntity(): Entity {
        return this._rootEntity;
    }

    constructor() {
        this._pathSearch = new PathSearch(new Graph([], 0, 0));
        this._jobQueueComponent = new JobQueueComponent();
        this._groundComponent = new TilesComponent();
        this._pathFindingComponent = new PathFindingComponent(this._pathSearch);

        this._rootEntity.addComponent(this._jobQueueComponent);
        this._rootEntity.addComponent(this._groundComponent);
        this._rootEntity.addComponent(this._pathFindingComponent);

        const firstWorker = workerPrefab(generateId("worker"));
        this._rootEntity.addChild(firstWorker);
        this.invalidateWorld();
    }

    tick(tick: number): void {
        /*         if (tick % 5 == 0) {
            this.invalidateWorld();
        } */
        this._rootEntity.onUpdate(tick);
    }

    invalidateWorld() {
        this._pathSearch.updateGraph(createGraphFromNodes(this._rootEntity));
    }

    onDraw(context: RenderContext): void {
        this._rootEntity.onDraw(context);
    }
}
