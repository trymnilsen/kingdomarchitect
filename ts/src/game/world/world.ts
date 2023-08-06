import { generateId } from "../../common/idGenerator.js";
import { PathSearch } from "../../path/search.js";
import { RenderContext } from "../../rendering/renderContext.js";
import { InventoryComponent } from "./component/inventory/inventoryComponent.js";
import { JobQueue } from "./component/job/jobQueue.js";
import { JobQueueComponent } from "./component/job/jobQueueComponent.js";
import { JobSchedulerComponent } from "./component/job/jobSchedulerComponent.js";
import {
    createGraphFromNodes,
    createLazyGraphFromRootNode,
} from "./component/root/path/generateGraph.js";
import { PathFindingComponent } from "./component/root/path/pathFindingComponent.js";
import { Ground } from "./component/tile/ground.js";
import { TileGeneratorComponent } from "./component/tile/tileGeneratorComponent.js";
import { TilesComponent } from "./component/tile/tilesComponent.js";
import { RootEntity } from "./entity/rootEntity.js";
import { farmPrefab } from "./prefab/farmPrefab.js";
import { housePrefab } from "./prefab/housePrefab.js";
import { workerPrefab } from "./prefab/workerPrefab.js";

export class World {
    private _pathSearch: PathSearch;
    private _rootEntity: RootEntity;

    private _groundComponent: TilesComponent;
    private _jobQueueComponent: JobQueueComponent;
    private _pathFindingComponent: PathFindingComponent;
    private _inventoryComponent: InventoryComponent;

    public get ground(): Ground {
        return this._groundComponent;
    }

    public get jobQueue(): JobQueue {
        return this._jobQueueComponent;
    }

    public get pathFinding(): PathFindingComponent {
        return this._pathFindingComponent;
    }

    public get rootEntity(): RootEntity {
        return this._rootEntity;
    }

    constructor() {
        this._rootEntity = new RootEntity("root");

        this._jobQueueComponent = new JobQueueComponent();
        this._groundComponent = new TilesComponent();

        this._inventoryComponent = new InventoryComponent();

        this._rootEntity.addComponent(this._inventoryComponent);
        this._rootEntity.addComponent(this._groundComponent);
        this._rootEntity.addComponent(this._jobQueueComponent);
        this._rootEntity.addComponent(new JobSchedulerComponent());
        this.rootEntity.addComponent(new TileGeneratorComponent());
        this._pathSearch = new PathSearch(
            createLazyGraphFromRootNode(this._rootEntity)
        );

        this._pathFindingComponent = new PathFindingComponent(this._pathSearch);
        this._rootEntity.addComponent(this._pathFindingComponent);

        //Set up initial entities
        const firstWorker = workerPrefab(generateId("worker"));
        const firstHouse = housePrefab(generateId("house"), false);
        const firstFarm = farmPrefab(generateId("farm"));
        firstFarm.position = { x: 2, y: 0 };
        firstHouse.position = { x: 1, y: 0 };
        this._rootEntity.addChild(firstFarm);
        this._rootEntity.addChild(firstWorker);
        this._rootEntity.addChild(firstHouse);
    }

    tick(tick: number): void {
        this._rootEntity.onUpdate(tick);
    }

    onDraw(context: RenderContext): void {
        this._rootEntity.onDraw(context);
    }
}
