import { Sprite2, sprites2 } from "../../../../asset/sprite.js";
import { ItemCategory } from "../../../../data/inventory/inventoryItem.js";
import { Entity } from "../../../entity/entity.js";
import { WorkerSpriteComponent } from "../../actor/mob/workerSpriteComponent.js";
import { EquipmentComponent } from "../../inventory/equipmentComponent.js";
import { SelectionInfo } from "../selectionInfo.js";
import { SelectionInfoProvider } from "../selectionInfoProvider.js";

export class WorkerSelectionInfoProvider implements SelectionInfoProvider {
    getInfo(entity: Entity): SelectionInfo | null {
        const workerSpriteComponent = entity.getComponent(
            WorkerSpriteComponent,
        );
        const equipmentComponent = entity.getComponent(EquipmentComponent);

        if (workerSpriteComponent && equipmentComponent) {
            const mainItem = equipmentComponent.mainItem.getItem();
            if (mainItem) {
                switch (mainItem.category) {
                    case ItemCategory.Magic:
                        return this.makeSelectionInfo(
                            "Wizard",
                            workerSpriteComponent.getSprite(),
                        );
                    case ItemCategory.Melee:
                        return this.makeSelectionInfo(
                            "Knight",
                            workerSpriteComponent.getSprite(),
                        );
                    case ItemCategory.Productivity:
                        return this.makeSelectionInfo(
                            "Worker",
                            workerSpriteComponent.getSprite(),
                        );
                    case ItemCategory.Ranged:
                        return this.makeSelectionInfo(
                            "Archer",
                            workerSpriteComponent.getSprite(),
                        );
                    default:
                        break;
                }
            }

            return this.makeSelectionInfo("Villager", sprites2.worker);
        } else {
            return null;
        }
    }

    private makeSelectionInfo(label: string, sprite: Sprite2): SelectionInfo {
        return {
            icon: sprite,
            title: label,
            subtitle: "Villager",
        };
    }
}
