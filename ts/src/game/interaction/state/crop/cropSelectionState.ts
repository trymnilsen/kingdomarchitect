import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    FarmComponentId,
    type FarmComponent,
} from "../../../component/farmComponent.ts";
import { getAvailableCrops } from "../../../../data/crop/cropDefinitions.ts";
import { bookSelectionView } from "../../view/bookSelectionView.ts";
import { SetFarmCropCommand } from "../../../../server/message/command/setFarmCropCommand.ts";

export class CropSelectionState extends InteractionState {
    private _entity: Entity;
    private _farmComponent: FarmComponent;
    private _selectedCropIndex: number = 0;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Crop";
    }

    constructor(entity: Entity) {
        super();
        const farmComponent = entity.getEcsComponent(FarmComponentId);
        if (!farmComponent) {
            throw new Error(
                "CropSelectionState requires a farm component on provided entity",
            );
        }
        this._entity = entity;
        this._farmComponent = farmComponent;

        // Seed the selection from the farm's current crop. Falls back to the
        // first available crop when the current crop is not (or no longer)
        // selectable, e.g. once unlock gating filters the list.
        const currentIndex = getAvailableCrops().findIndex(
            (crop) => crop.cropId === farmComponent.cropId,
        );
        this._selectedCropIndex = currentIndex >= 0 ? currentIndex : 0;
    }

    override getView(): ComponentDescriptor | null {
        const crops = getAvailableCrops();
        return bookSelectionView({
            entries: crops,
            currentIndex: crops.findIndex(
                (crop) => crop.cropId === this._farmComponent.cropId,
            ),
            selectedIndex: this._selectedCropIndex,
            onSelected: (index: number) => {
                this._selectedCropIndex = index;
            },
            onAssign: (index: number) => {
                this.context.commandDispatcher(
                    SetFarmCropCommand(this._entity, crops[index].cropId),
                );
                this.context.stateChanger.pop();
            },
            onCancel: () => {
                this.context.stateChanger.pop();
            },
        });
    }
}
