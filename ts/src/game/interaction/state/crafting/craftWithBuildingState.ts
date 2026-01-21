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
import { CollectItemJob } from "../../../job/collectItemJob.ts";
import { createCraftingJob } from "../../../job/craftingJob.ts";
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
            isCrafting: false,
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

        const job = createCraftingJob(this._buildingEntity.id, selectedRecipe);
        this.context.commandDispatcher(QueueJobCommand(job));
    }

    private onCancelCrafting() {
        // Job cancellation would be handled through job queue UI if available
        // For now, this is a no-op since jobs are managed through the job system
    }

    private onCollect() {
        // Queue a job for a worker to collect items from this building
        const job = CollectItemJob(this._buildingEntity);
        this.context.commandDispatcher(QueueJobCommand(job));
        this.context.stateChanger.pop();
    }
}
