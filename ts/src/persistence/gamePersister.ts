import { getGeneratorIds, setGeneratorIds } from "../common/idGenerator.js";
import { EntityComponent } from "../game/component/entityComponent.js";
import { Entity } from "../game/entity/entity.js";
import { EntityPersister } from "./entityPersister.js";

export class GamePersister {
    private entityPersister: EntityPersister = new EntityPersister();

    public get hasSaveData(): boolean {
        return window.localStorage.length > 0;
    }

    save(world: Entity) {
        const ids = getGeneratorIds();
        const bundleSets = this.entityPersister.persist(world);
        const bundleSetsAsJson = JSON.stringify(bundleSets);
        window.localStorage.setItem("bundles", bundleSetsAsJson);
        window.localStorage.setItem("ids", JSON.stringify(ids));
    }

    loadWorld(): Entity {
        const loadTimeStart = performance.now();
        const bundleSetsAsJson = window.localStorage.getItem("bundles")!;
        const ids = JSON.parse(window.localStorage.getItem("ids")!);
        setGeneratorIds(ids);
        const bundleSets = JSON.parse(bundleSetsAsJson);
        const rootEntity = this.entityPersister.load(bundleSets);
        const loadTimeEnd = performance.now();
        const loadTime = loadTimeEnd - loadTimeStart;
        console.log("Load time: ", loadTime);
        return rootEntity;
    }
}
