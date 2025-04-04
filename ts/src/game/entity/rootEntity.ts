import { generateId } from "../../common/idGenerator.js";
import { PathSearch } from "../../module/path/search.js";
import { JobQueueComponent } from "../componentOld/job/jobQueueComponent.js";
import { JobSchedulerComponent } from "../componentOld/job/jobSchedulerComponent.js";
import { ForrestComponent } from "../componentOld/resource/forrestComponent.js";
import { createLazyGraphFromRootNode } from "../componentOld/root/path/generateGraph.js";
import { PathFindingComponent } from "../componentOld/root/path/pathFindingComponent.js";
import { TilesComponent } from "../componentOld/tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../componentOld/world/spatialChunkMapComponent.js";
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

    rootEntity.addComponent(groundComponent);
    rootEntity.addComponent(jobQueueComponent);
    rootEntity.addComponent(new SpatialChunkMapComponent());
    rootEntity.addComponent(new JobSchedulerComponent());
    rootEntity.addComponent(new ForrestComponent());
    const pathFindingComponent = new PathFindingComponent();
    rootEntity.addComponent(pathFindingComponent);
    rootEntity.toggleIsGameRoot(true);
    return rootEntity;
}
