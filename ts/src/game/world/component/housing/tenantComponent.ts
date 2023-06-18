import { Entity } from "../../entity/entity";
import { EntityComponent } from "../entityComponent";

export class TenantComponent extends EntityComponent {
    private _house: Entity | null = null;

    public get house(): Entity | null {
        return this._house;
    }

    public set house(v: Entity | null) {
        this._house = v;
    }
}
