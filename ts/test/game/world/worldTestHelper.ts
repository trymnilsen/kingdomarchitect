import { Entity } from "../../../src/game/entity/entity.js";

export class WorldTestHelper {
    private _rootEntity: Entity;
    public get rootEntity(): Entity {
        return this._rootEntity;
    }

    constructor() {
        this._rootEntity = new Entity("root");
    }

    runUpdates(_ticks: number) {}
}
