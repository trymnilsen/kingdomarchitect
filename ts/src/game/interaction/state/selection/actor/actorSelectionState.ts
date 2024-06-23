import { sprites2 } from "../../../../../asset/sprite.js";
import { Point } from "../../../../../common/point.js";
import { allSides } from "../../../../../common/sides.js";
import {
    InventoryItem,
    ItemCategory,
} from "../../../../../data/inventory/inventoryItem.js";
import { RenderContext } from "../../../../../rendering/renderContext.js";
import { SpriteComponent } from "../../../../component/draw/spriteComponent.js";
import { EquipmentComponent } from "../../../../component/inventory/equipmentComponent.js";
import { InventoryComponent2 } from "../../../../component/inventory/inventoryComponent.js";
import { Entity } from "../../../../entity/entity.js";
import { TileSize } from "../../../../map/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar.js";
import { CharacterSkillState } from "../../character/characterSkillState.js";
import { ActorMovementState } from "./actorMovementState.js";
import { ActorSelectionPresenter } from "./actorSelectionPresenter.js";
import {
    ActorSelectionProvider,
    ButtonSelection,
} from "./provider/actorSelectionProvider.js";
import { WorkerSelectionProvider } from "./provider/workerSelectionProvider.js";

export class ActorSelectionState extends InteractionState {
    private presenter: ActorSelectionPresenter | null = null;
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
    ];

    constructor(private entity: Entity) {
        super();
    }

    override onActive(): void {
        const items = this.getActionItems();
        this.presenter = new ActorSelectionPresenter(items.left, items.right);
        this.view = this.presenter.root;
    }

    override onUpdate(_tick: number): void {
        this.updateActionbarItems();
    }

    override onDraw(context: RenderContext): void {
        super.onDraw(context);

        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.entity.worldPosition,
        );

        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
            height: TileSize,
            width: TileSize,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });
    }

    private getActionItems(): ButtonSelection {
        const leftItems: UIActionbarItem[] = [];
        const rightItems: UIActionbarItem[] = [];

        for (const provider of this.providers) {
            const item = provider.provideButtons(this.context, this.entity);
            leftItems.push(...item.left);
            rightItems.push(...item.right);
        }

        return {
            left: leftItems,
            right: rightItems,
        };
    }

    private updateActionbarItems() {
        const items = this.getActionItems();
        this.presenter?.setLeftMenu(items.left);
        this.presenter?.setRightMenu(items.right);
    }
}
