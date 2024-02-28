import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";

export class TenantComponent extends EntityComponent {
    private _houseEntityId: string | null = null;

    get houseEntityId(): string | null {
        return this._houseEntityId;
    }

    set houseEntityId(v: string | null) {
        this._houseEntityId = v;
    }
}
