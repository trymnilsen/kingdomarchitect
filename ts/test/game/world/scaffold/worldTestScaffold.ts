import { Point } from "../../../../src/common/point.js";
import { TilesComponent } from "../../../../src/game/component/tile/tilesComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { createRootEntity } from "../../../../src/game/entity/rootEntity.js";

export abstract class WorldTestScaffold {
    private _rootEntity: Entity;
    public get rootEntity(): Entity {
        return this._rootEntity;
    }

    constructor(size: Point) {
        this._rootEntity = createRootEntity();
        const component = this._rootEntity.requireComponent(TilesComponent);
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                component.setTile(
                    {
                        tileX: x,
                        tileY: y,
                        type: "forrest",
                    },
                    true,
                );
            }
        }
    }

    runUpdates(_ticks: number) {
        for (let i = 0; i < _ticks; i++) {
            this._rootEntity.onUpdate(i);
        }
    }
}
