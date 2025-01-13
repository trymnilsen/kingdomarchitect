import { generateId } from "../../common/idGenerator.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import { Entity } from "../entity/entity.js";
import { farmPrefab } from "../prefab/farmPrefab.js";
import { housePrefab } from "../prefab/housePrefab.js";
import { treePrefab } from "../prefab/treePrefab.js";
import { wellPrefab } from "../prefab/wellPrefab.js";
import { workerPrefab } from "../prefab/workerPrefab.js";

export function addInitialPlayerChunk(rootEntity: Entity) {
    rootEntity.requireComponent(TilesComponent).setChunk({
        chunkX: 0,
        chunkY: 0,
        type: "forrest",
        discovered: new Set(),
    });
    const firstWorker = workerPrefab(generateId("worker"));
    const firstHouse = housePrefab(generateId("house"), false);
    const firstFarm = farmPrefab(generateId("farm"));
    const firstTree = treePrefab(generateId("tree"), 1);
    const well = wellPrefab(generateId("well"));

    const randomOffsetX = Math.round(Math.random() * 3) + 1;
    const randomOffsetY = Math.round(Math.random() * 3) + 1;
    firstFarm.position = { x: 1 + randomOffsetX, y: 0 + randomOffsetY };
    firstHouse.position = { x: 0 + randomOffsetX, y: 0 + randomOffsetY };
    firstTree.position = { x: 2 + randomOffsetX, y: 2 + randomOffsetY };
    firstWorker.position = { x: 0 + randomOffsetX, y: 1 + randomOffsetY };
    well.position = { x: 1 + randomOffsetX, y: 1 + randomOffsetY };
    rootEntity.addChild(firstFarm);
    rootEntity.addChild(firstWorker);
    rootEntity.addChild(firstHouse);
    rootEntity.addChild(firstTree);
    rootEntity.addChild(well);
}
