import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";

type TenantBundle = {
    houseEntityId: string | null;
};

export class TenantComponent extends EntityComponent<TenantBundle> {
    private _houseEntityId: string | null = null;

    public get houseEntityId(): string | null {
        return this._houseEntityId;
    }

    public set houseEntityId(v: string | null) {
        this._houseEntityId = v;
    }

    override fromBundle(bundle: TenantBundle): void {
        this._houseEntityId = bundle.houseEntityId;
    }
    override toBundle(): TenantBundle {
        return {
            houseEntityId: this._houseEntityId,
        };
    }
}
