import { Point } from "../../../../src/common/point.js";
import { TilesComponent } from "../../../../src/game/component/tile/tilesComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { createRootEntity } from "../../../../src/game/entity/rootEntity.js";

export abstract class WorldTestScaffold {
    private _rootEntity: Entity;
    public get rootEntity(): Entity {
        return this._rootEntity;
    }

    constructor() {
        this._rootEntity = createRootEntity();
        const component = this._rootEntity.requireComponent(TilesComponent);
        component.setChunk({
            chunkX: 0,
            chunkY: 0,
            discovered: new Set(),
            type: "forrest",
        });
    }

    runUpdates(_ticks: number) {
        for (let i = 0; i < _ticks; i++) {
            this._rootEntity.onUpdate(i);
        }
    }
}
