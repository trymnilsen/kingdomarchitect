import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";

type TenantBundle = {
    houseEntityId: string | null;
}

export class TenantComponent extends EntityComponent<TenantBundle> {
    private _houseEntityId: string | null = null;

    get houseEntityId(): string | null {
        return this._houseEntityId;
    }

    set houseEntityId(v: string | null) {
        this._houseEntityId = v;
    }

    override fromComponentBundle(bundle: TenantBundle): void {
        this._houseEntityId = bundle.houseEntityId;
    }
    override toComponentBundle(): TenantBundle {
        return {
            houseEntityId: this._houseEntityId,
        };
    }
}
