import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";

export class TenantComponent extends EntityComponent {
    private _house: Entity | null = null;

    public get house(): Entity | null {
        return this._house;
    }

    public set house(v: Entity | null) {
        this._house = v;
    }
}
