import { getGeneratorIds, setGeneratorIds } from "../common/idGenerator.js";
import { Point, zeroPoint } from "../common/point.js";
import { Entity } from "../game/entity/entity.js";
import { Camera } from "../rendering/camera.js";
import { EntityPersister } from "./entityPersister.js";

export type LoadedItems = {
    rootEntity: Entity;
    cameraPosition: Point;
}

export class GamePersister {
    private entityPersister: EntityPersister = new EntityPersister();

    get hasSaveData(): boolean {
        return window.localStorage.length > 0;
    }

    save(world: Entity, camera: Camera) {
        const saveTimeStart = performance.now();
        const ids = getGeneratorIds();
        const bundleSets = this.entityPersister.persist(world);
        const bundleSetsAsJson = JSON.stringify(bundleSets);
        window.localStorage.setItem("bundles", bundleSetsAsJson);
        window.localStorage.setItem("ids", JSON.stringify(ids));
        window.localStorage.setItem("camera", JSON.stringify(camera.position));
        const saveTimeEnd = performance.now();
        const saveTime = saveTimeEnd - saveTimeStart;
    }

    loadWorld(): LoadedItems {
        const loadTimeStart = performance.now();
        const bundleSetsAsJson = window.localStorage.getItem("bundles")!;
        const ids = JSON.parse(window.localStorage.getItem("ids")!);
        setGeneratorIds(ids);
        const cameraJson = window.localStorage.getItem("camera");
        let cameraPosition = zeroPoint();
        if (cameraJson) {
            cameraPosition = JSON.parse(cameraJson);
        }
        const bundleSets = JSON.parse(bundleSetsAsJson);
        const rootEntity = this.entityPersister.load(bundleSets);
        const loadTimeEnd = performance.now();
        const loadTime = loadTimeEnd - loadTimeStart;
        console.log("Load time: ", loadTime);
        return {
            rootEntity,
            cameraPosition,
        };
    }
}
