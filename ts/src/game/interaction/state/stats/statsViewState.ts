import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import type { StatType } from "../../../stat/statType.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { statsView } from "./statsView.ts";

export class StatsViewState extends InteractionState {
    private _entity: Entity;
    private _selectedStat: StatType | null = null;

    constructor(entity: Entity) {
        super();
        this._entity = entity;
    }

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Stats";
    }

    override getView(): ComponentDescriptor | null {
        return statsView({
            entity: this._entity,
            selectedStat: this._selectedStat,
            onStatSelected: (stat: StatType) => {
                this._selectedStat = stat;
            },
            onClose: () => {
                this.context.stateChanger.pop();
            },
        });
    }
}
