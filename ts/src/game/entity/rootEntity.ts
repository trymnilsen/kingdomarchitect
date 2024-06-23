import { generateId } from "../../common/idGenerator.js";
import { PathSearch } from "../../path/search.js";
import { JobQueueComponent } from "../component/job/jobQueueComponent.js";
import { JobSchedulerComponent } from "../component/job/jobSchedulerComponent.js";
import { ForrestComponent } from "../component/resource/forrestComponent.js";
import { ChunkMapComponent } from "../component/root/chunk/chunkMapComponent.js";
import { createLazyGraphFromRootNode } from "../component/root/path/generateGraph.js";
import { PathFindingComponent } from "../component/root/path/pathFindingComponent.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { farmPrefab } from "../prefab/farmPrefab.js";
import { housePrefab } from "../prefab/housePrefab.js";
import { treePrefab } from "../prefab/treePrefab.js";
import { wellPrefab } from "../prefab/wellPrefab.js";
import { workerPrefab } from "../prefab/workerPrefab.js";
import { Entity } from "./entity.js";

export function createRootEntity(): Entity {
    const rootEntity = new Entity("root");
    const jobQueueComponent = new JobQueueComponent();
    const groundComponent = new TilesComponent();
    const chunkmapComponent = new ChunkMapComponent();
    rootEntity.addComponent(groundComponent);
    rootEntity.addComponent(jobQueueComponent);
    rootEntity.addComponent(chunkmapComponent);
    rootEntity.addComponent(new JobSchedulerComponent());
    rootEntity.addComponent(new ForrestComponent());
    const pathFindingComponent = new PathFindingComponent();
    rootEntity.addComponent(pathFindingComponent);
    rootEntity.toggleIsGameRoot(true);
    return rootEntity;
    /*
    //Set up initial entities
    const firstWorker = workerPrefab(generateId("worker"));
    const firstHouse = housePrefab(generateId("house"), false);
    const firstFarm = farmPrefab(generateId("farm"));
    const firstTree = treePrefab(generateId("tree"), 1);
    const well = wellPrefab(generateId("well"));
    firstFarm.position = { x: 1, y: 0 };
    firstHouse.position = { x: 0, y: 0 };
    firstTree.position = { x: 2, y: 2 };
    firstWorker.position = { x: 0, y: 1 };
    well.position = { x: 1, y: 1 };
    rootEntity.addChild(firstFarm);
    rootEntity.addChild(firstWorker);
    rootEntity.addChild(firstHouse);
    rootEntity.addChild(firstTree);
    rootEntity.addChild(well);
    */
}
