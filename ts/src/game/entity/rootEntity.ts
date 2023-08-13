import { generateId } from "../../common/idGenerator.js";
import { PathSearch } from "../../path/search.js";
import { InventoryComponent } from "../component/inventory/inventoryComponent.js";
import { JobQueueComponent } from "../component/job/jobQueueComponent.js";
import { JobSchedulerComponent } from "../component/job/jobSchedulerComponent.js";
import { createLazyGraphFromRootNode } from "../component/root/path/generateGraph.js";
import { PathFindingComponent } from "../component/root/path/pathFindingComponent.js";
import { TileGeneratorComponent } from "../component/tile/tileGeneratorComponent.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { farmPrefab } from "../prefab/farmPrefab.js";
import { housePrefab } from "../prefab/housePrefab.js";
import { workerPrefab } from "../prefab/workerPrefab.js";
import { Entity } from "./entity.js";

export function createRootEntity(): Entity {
    const rootEntity = new Entity("root");
    const jobQueueComponent = new JobQueueComponent();
    const groundComponent = new TilesComponent();
    const inventoryComponent = new InventoryComponent();

    rootEntity.addComponent(inventoryComponent);
    rootEntity.addComponent(groundComponent);
    rootEntity.addComponent(jobQueueComponent);
    rootEntity.addComponent(new JobSchedulerComponent());
    rootEntity.addComponent(new TileGeneratorComponent());
    const pathSearch = new PathSearch(createLazyGraphFromRootNode(rootEntity));
    const pathFindingComponent = new PathFindingComponent(pathSearch);
    rootEntity.addComponent(pathFindingComponent);

    //Set up initial entities
    const firstWorker = workerPrefab(generateId("worker"));
    const firstHouse = housePrefab(generateId("house"), false);
    const firstFarm = farmPrefab(generateId("farm"));
    firstFarm.position = { x: 2, y: 0 };
    firstHouse.position = { x: 1, y: 0 };
    rootEntity.addChild(firstFarm);
    rootEntity.addChild(firstWorker);
    rootEntity.addChild(firstHouse);

    return rootEntity;
}
