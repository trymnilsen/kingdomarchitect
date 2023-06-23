function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { generateId } from "../../common/idGenerator.js";
import { PathSearch } from "../../path/search.js";
import { InventoryComponent } from "./component/inventory/inventoryComponent.js";
import { JobQueueComponent } from "./component/job/jobQueueComponent.js";
import { createLazyGraphFromRootNode } from "./component/root/path/generateGraph.js";
import { PathFindingComponent } from "./component/root/path/pathFindingComponent.js";
import { TilesComponent } from "./component/tile/tilesComponent.js";
import { RootEntity } from "./entity/rootEntity.js";
import { farmPrefab } from "./prefab/farmPrefab.js";
import { housePrefab } from "./prefab/housePrefab.js";
import { workerPrefab } from "./prefab/workerPrefab.js";
export class World {
    get ground() {
        return this._groundComponent;
    }
    get jobQueue() {
        return this._jobQueueComponent;
    }
    get pathFinding() {
        return this._pathFindingComponent;
    }
    get rootEntity() {
        return this._rootEntity;
    }
    tick(tick) {
        /*         if (tick % 5 == 0) {
            this.invalidateWorld();
        } */ this._rootEntity.onUpdate(tick);
    }
    /*     invalidateWorld() {
        this._pathSearch.updateGraph(createGraphFromNodes(this._rootEntity));
    } */ onDraw(context) {
        this._rootEntity.onDraw(context);
    }
    constructor(){
        _define_property(this, "_pathSearch", void 0);
        _define_property(this, "_rootEntity", void 0);
        _define_property(this, "_groundComponent", void 0);
        _define_property(this, "_jobQueueComponent", void 0);
        _define_property(this, "_pathFindingComponent", void 0);
        _define_property(this, "_inventoryComponent", void 0);
        this._rootEntity = new RootEntity("root");
        this._jobQueueComponent = new JobQueueComponent();
        this._groundComponent = new TilesComponent();
        this._inventoryComponent = new InventoryComponent();
        this._rootEntity.addComponent(this._inventoryComponent);
        this._rootEntity.addComponent(this._groundComponent);
        this._rootEntity.addComponent(this._jobQueueComponent);
        this._pathSearch = new PathSearch(createLazyGraphFromRootNode(this._rootEntity));
        this._pathFindingComponent = new PathFindingComponent(this._pathSearch);
        this._rootEntity.addComponent(this._pathFindingComponent);
        //Set up initial entities
        const firstWorker = workerPrefab(generateId("worker"));
        const firstHouse = housePrefab(generateId("house"), false, firstWorker);
        const firstFarm = farmPrefab(generateId("farm"));
        firstFarm.position = {
            x: 2,
            y: 0
        };
        firstHouse.position = {
            x: 1,
            y: 0
        };
        this._rootEntity.addChild(firstFarm);
        this._rootEntity.addChild(firstWorker);
        this._rootEntity.addChild(firstHouse);
    }
}
