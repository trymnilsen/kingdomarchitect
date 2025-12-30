import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    CraftingComponentId,
    type CraftingComponent,
} from "../../../component/craftingComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../component/collectableComponent.ts";
import { craftingView } from "./craftingView.ts";
import { StartCraftingCommand } from "../../../../server/message/command/startCraftingCommand.ts";
import { CancelCraftingCommand } from "../../../../server/message/command/cancelCraftingCommand.ts";
import { CollectItemJob } from "../../../job/collectItemJob.ts";
import { QueueJobCommand } from "../../../../server/message/command/queueJobCommand.ts";

export class CraftWithBuildingState extends InteractionState {
    private _selectedRecipeIndex = 0;
    private _craftingComponent: CraftingComponent;
    private _buildingEntity: Entity;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Crafting";
    }

    override getView(): ComponentDescriptor | null {
        const collectableComponent = this._buildingEntity.getEcsComponent(
            CollectableComponentId,
        );

        return craftingView({
            recipes: this._craftingComponent.recipes,
            selectedRecipeIndex: this._selectedRecipeIndex,
            isCrafting: this._craftingComponent.activeCrafting !== null,
            hasCollectableItems:
                collectableComponent !== null &&
                hasCollectableItems(collectableComponent),
            onRecipeSelected: (index: number) => {
                this._selectedRecipeIndex = index;
            },
            onCraft: () => {
                this.onCraft();
            },
            onCollect: () => {
                this.onCollect();
            },
            onCancel: () => {
                this.onCancelCrafting();
            },
        });
    }

    constructor(buildingEntity: Entity) {
        super();
        const craftingComponent =
            buildingEntity.getEcsComponent(CraftingComponentId);
        if (!craftingComponent) {
            throw new Error(
                "CraftWithBuildingState requires a CraftingComponent on provided entity",
            );
        }

        this._buildingEntity = buildingEntity;
        this._craftingComponent = craftingComponent;
    }

    override onActive(): void {
        // No imperative UI setup needed
    }

    private onCraft() {
        const selectedRecipe =
            this._craftingComponent.recipes[this._selectedRecipeIndex];
        if (!selectedRecipe) {
            return;
        }

        this.context.commandDispatcher(
            StartCraftingCommand(this._buildingEntity.id, selectedRecipe.id),
        );
    }

    private onCancelCrafting() {
        this.context.commandDispatcher(
            CancelCraftingCommand(this._buildingEntity.id),
        );
    }

    private onCollect() {
        // Queue a job for a worker to collect items from this building
        const job = CollectItemJob(this._buildingEntity);
        this.context.commandDispatcher(QueueJobCommand(job));
        this.context.stateChanger.pop();
    }
}
