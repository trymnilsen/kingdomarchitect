import { Entity } from "../../../entity/entity.js";

export type MovementBundle = {};
export class MovementHelper {
    private _entity: Entity | null = null;

    public get entity(): Entity {
        if (!this._entity) {
            throw new Error("Entity is not set for movement helper");
        }

        return this._entity;
    }

    public set entity(v: Entity) {
        this._entity = v;
    }

    public toBundle(): MovementBundle {
        return {};
    }

    public fromBundle(bundle: MovementBundle) {}
}
