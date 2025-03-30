import { EntityComponent } from "../entityComponent.js";

export enum SettlementType {
    Orc,
    Human,
}

export class SettlementComponent extends EntityComponent {
    public type: SettlementType = SettlementType.Human;
}
