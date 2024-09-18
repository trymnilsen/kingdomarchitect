import { Sprite2 } from "../../../asset/sprite.js";
import { Point } from "../../../common/point.js";
import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { EntityComponent } from "../entityComponent.js";

export class CollectableInventoryItemComponent extends EntityComponent {
    private _currentItem: InventoryItem | null = null;

    public get currentItem(): Readonly<InventoryItem> | null {
        return this._currentItem;
    }

    public set currentItem(value: InventoryItem) {
        this._currentItem = value;
    }

    private offset: number = 0;
    private sprite: Sprite2 | null = null;
    override onUpdate(_tick: number): void {
        if (this.offset == 0) {
            this.offset = 8;
        } else {
            this.offset = 0;
        }
    }
    override onDraw(
        context: RenderContext,
        screenPosition: Point,
        _visibilityMap: RenderVisibilityMap,
    ): void {
        if (!!this._currentItem) {
            context.drawScreenSpaceSprite({
                sprite: this._currentItem.asset,
                x: screenPosition.x,
                y: screenPosition.y + this.offset,
            });
        }
    }
}
