import { generateId } from "../../common/idGenerator";
import { PathSearch } from "../../path/search";
import { RenderContext } from "../../rendering/renderContext";
import { InventoryComponent } from "./component/inventory/inventoryComponent";
import { JobQueue } from "./component/job/jobQueue";
import { JobQueueComponent } from "./component/job/jobQueueComponent";
import {
    createGraphFromNodes,
    createLazyGraphFromRootNode,
} from "./component/root/path/generateGraph";
import { PathFindingComponent } from "./component/root/path/pathFindingComponent";
import { Ground } from "./component/tile/ground";
import { TilesComponent } from "./component/tile/tilesComponent";
import { RootEntity } from "./entity/rootEntity";
import { farmPrefab } from "./prefab/farmPrefab";
import { housePrefab } from "./prefab/housePrefab";
import { workerPrefab } from "./prefab/workerPrefab";

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

        this._pathSearch = new PathSearch(
            createLazyGraphFromRootNode(this._rootEntity)
        );

        this._pathFindingComponent = new PathFindingComponent(this._pathSearch);
        this._rootEntity.addComponent(this._pathFindingComponent);

        //Set up initial entities
        const firstWorker = workerPrefab(generateId("worker"));
        const firstHouse = housePrefab(generateId("house"), false, firstWorker);
        const firstFarm = farmPrefab(generateId("farm"));
        firstFarm.position = { x: 2, y: 0 };
        firstHouse.position = { x: 1, y: 0 };
        this._rootEntity.addChild(firstFarm);
        this._rootEntity.addChild(firstWorker);
        this._rootEntity.addChild(firstHouse);
    }

    tick(tick: number): void {
        /*         if (tick % 5 == 0) {
            this.invalidateWorld();
        } */
        this._rootEntity.onUpdate(tick);
    }

    /*     invalidateWorld() {
        this._pathSearch.updateGraph(createGraphFromNodes(this._rootEntity));
    } */

    onDraw(context: RenderContext): void {
        this._rootEntity.onDraw(context);
    }
}
