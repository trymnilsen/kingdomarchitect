import { sprites2 } from "../../../../../asset/sprite.js";
import { Point } from "../../../../../common/point.js";
import { allSides } from "../../../../../common/sides.js";
import { RenderContext } from "../../../../../rendering/renderContext.js";
import { EquipmentComponent } from "../../../../component/inventory/equipmentComponent.js";
import { Entity } from "../../../../entity/entity.js";
import { TileSize } from "../../../../tile/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar.js";
import { CharacterSkillState } from "../../character/characterSkillState.js";
import { ActorMovementState } from "./actorMovementState.js";
import { ActorSelectionPresenter } from "./actorSelectionPresenter.js";

export class ActorSelectionState extends InteractionState {
    private presenter: ActorSelectionPresenter | null = null;
    private expandedMenuState: boolean = false;

    constructor(private entity: Entity) {
        super();
    }

    override onTap(screenPosition: Point, worldPosition: Point): boolean {
        if (this.expandedMenuState) {
            this.expandedMenuState = false;
            this.presenter?.setExpandedMenu([]);
            return true;
        } else {
            return false;
        }
    }

    override onActive(): void {
        const items: UIActionbarItem[] = [
            {
                text: "Move",
                onClick: () => {
                    this.context.stateChanger.push(
                        new ActorMovementState(this.entity)
                    );
                },
            },
            {
                text: "Skills",
                onClick: () => {
                    this.context.stateChanger.push(new CharacterSkillState());
                },
            },
            {
                text: "Stats",
            },
            {
                text: "Close",
            },
        ];

        const rightItems = this.getRightItems();
        this.presenter = new ActorSelectionPresenter(items, rightItems);
        this.view = this.presenter.root;
    }

    override onDraw(context: RenderContext): void {
        super.onDraw(context);

        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.entity.worldPosition
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

    private getRightItems(): UIActionbarItem[] {
        const items: UIActionbarItem[] = [];
        const equipment = this.entity.getComponent(EquipmentComponent);
        if (equipment && equipment.mainItem) {
            items.push({
                text: "Main",
                onClick: () => {
                    this.onMainItemTap();
                },
                icon: equipment.mainItem.asset,
            });
        } else {
            items.push({
                text: "Main",
                onClick: () => {
                    this.onMainItemTap();
                },
                icon: sprites2.empty_sprite,
            });
        }

        if (equipment && equipment.otherItem) {
            items.push({
                text: "Other",
                icon: equipment.otherItem.asset,
            });
        } else {
            items.push({
                text: "Other",
                icon: sprites2.empty_sprite,
            });
        }

        return items;
    }

    private onMainItemTap() {
        if (!this.presenter) {
            throw new Error("Presenter not set");
        }
        this.expandedMenuState = true;
        this.presenter.setExpandedMenu([
            {
                text: "Unequip",
            },
            {
                text: "Attack",
            },
        ]);
    }
}
