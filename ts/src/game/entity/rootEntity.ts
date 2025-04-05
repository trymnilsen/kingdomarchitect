import { generateId } from "../../common/idGenerator.js";
import { PathSearch } from "../../module/path/search.js";
import { Entity } from "./entity.js";

export function createRootEntity(): Entity {
    const rootEntity = new Entity("root");
    /*
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
    */
    return rootEntity;
}
