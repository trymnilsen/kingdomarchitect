import { sprites2 } from "../../../../../asset/sprite.js";
import {
    InventoryItem,
    ItemCategory,
} from "../../../../../data/inventory/inventoryItem.js";
import { RenderContext } from "../../../../../rendering/renderContext.js";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../../ui/uiSize.js";
import { WorkerBehaviorComponent } from "../../../../component/behavior/workerBehaviorComponent.js";
import { SpriteComponent } from "../../../../component/draw/spriteComponent.js";
import { EquipmentComponent } from "../../../../component/inventory/equipmentComponent.js";
import { InventoryComponent } from "../../../../component/inventory/inventoryComponent.js";
import { firstChildWhere } from "../../../../world/entity/child/first.js";
import { Entity } from "../../../../world/entity/entity.js";
import { GroundTile } from "../../../../world/tile/ground.js";
import { TileSize } from "../../../../world/tile/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../../common/alertMessageState.js";

export class EquipItemState extends InteractionState {
    private cursorSelection: Entity | null = null;
    private inventoryItem: InventoryItem;

    constructor(inventoryItem: InventoryItem) {
        super();
        this.inventoryItem = inventoryItem;
    }

    override onActive(): void {
        this.cursorSelection = firstChildWhere(
            this.context.world.rootEntity,
            (child) => {
                return isWorker(child);
            }
        );

        const actions: UIActionbarItem[] = [
            {
                text: "Confirm",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.confirmEquip();
                },
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.cancel();
                },
            },
        ];

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldState = new UIActionbarScaffold(
            contentView,
            actions,
            [],
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldState;
    }

    override onDraw(context: RenderContext): void {
        // Draw a scrim below the content
        context.drawScreenSpaceRectangle({
            x: 0,
            y: 0,
            width: context.width,
            height: context.height,
            fill: "rgba(20, 20, 20, 0.8)",
        });
        // Call our super to draw the view
        super.onDraw(context);

        // Draw all workers on top of the scrim
        this.drawWorker(context, this.context.world.rootEntity);

        // Draw the currently selected worker cursor
        if (this.cursorSelection) {
            context.drawSprite({
                sprite: sprites2.cursor,
                x: this.cursorSelection.position.x * TileSize,
                y: this.cursorSelection.position.y * TileSize,
            });
        }
    }

    override onTileTap(tile: GroundTile): boolean {
        const workers = this.context.world.rootEntity
            .getEntityAt({
                x: tile.tileX,
                y: tile.tileY,
            })
            .filter((entity) => {
                return isWorker(entity);
            });

        if (workers.length > 0) {
            this.cursorSelection = workers[0];
            return true;
        } else {
            return false;
        }
    }

    private confirmEquip() {
        const inventoryComponent =
            this.context.world.rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component present on root entity");
        }

        if (this.cursorSelection == null) {
            throw new Error("Cannot confirm equip on empty selection");
        }

        const equipmentComponent =
            this.cursorSelection.getComponent(EquipmentComponent);

        if (!equipmentComponent) {
            throw new Error("No equipment component on selection");
        }

        const spriteComponent =
            this.cursorSelection.getComponent(SpriteComponent);

        if (!spriteComponent) {
            throw new Error("No sprite component");
        }

        const removeResult = inventoryComponent.removeInventoryItem(
            this.inventoryItem.id,
            1
        );

        if (removeResult) {
            equipmentComponent.mainItem = this.inventoryItem;
            switch (this.inventoryItem.category) {
                case ItemCategory.Melee:
                    spriteComponent.updateSprite(sprites2.knight);
                    break;
                case ItemCategory.Ranged:
                    spriteComponent.updateSprite(sprites2.bowman);
                    break;
                case ItemCategory.Magic:
                    spriteComponent.updateSprite(sprites2.mage);
                    break;
                case ItemCategory.Productivity:
                    spriteComponent.updateSprite(sprites2.worker);
                    break;
            }

            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.replace(
                new AlertMessageState("Uh oh", "Item no longer available")
            );
        }
    }

    private cancel() {
        this.context.stateChanger.pop(null);
    }

    private drawWorker(context: RenderContext, worker: Entity) {
        if (isWorker(worker)) {
            worker.onDraw(context);

            /*
            const screenPosition = context.camera.tileSpaceToScreenSpace(
                worker.worldPosition
            );
            //Draw the name of the npc
            context.drawText({
                text: "Philip",
                x: screenPosition.x,
                y: screenPosition.y + 40,
                color: "white",
                font: "Silkscreen",
                size: 16,
            });*/
        }

        for (const childWorker of worker.children) {
            this.drawWorker(context, childWorker);
        }
    }
}

function isWorker(entity: Entity) {
    const workerComponent = entity.getComponent(WorkerBehaviorComponent);
    const equipmentComponent = entity.getComponent(EquipmentComponent);
    return !!workerComponent && !!equipmentComponent;
}
