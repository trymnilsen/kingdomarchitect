function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../../../asset/sprite.js";
import { allSides } from "../../../../../common/sides.js";
import { EquipmentComponent } from "../../../../world/component/inventory/equipmentComponent.js";
import { TileSize } from "../../../../world/tile/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { CharacterSkillState } from "../../character/characterSkillState.js";
import { ActorMovementState } from "./actorMovementState.js";
import { ActorSelectionPresenter } from "./actorSelectionPresenter.js";
export class ActorSelectionState extends InteractionState {
    onTap(screenPosition, worldPosition) {
        if (this.expandedMenuState) {
            this.expandedMenuState = false;
            this.presenter?.setExpandedMenu([]);
            return true;
        } else {
            return false;
        }
    }
    onActive() {
        const items = [
            {
                text: "Move",
                onClick: ()=>{
                    this.context.stateChanger.push(new ActorMovementState(this.entity));
                }
            },
            {
                text: "Skills",
                onClick: ()=>{
                    this.context.stateChanger.push(new CharacterSkillState());
                }
            },
            {
                text: "Stats"
            },
            {
                text: "Close"
            }
        ];
        const rightItems = this.getRightItems();
        this.presenter = new ActorSelectionPresenter(items, rightItems);
        this.view = this.presenter.root;
    }
    onDraw(context) {
        super.onDraw(context);
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(this.entity.worldPosition);
        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
            height: TileSize,
            width: TileSize,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y
        });
    }
    getRightItems() {
        const items = [];
        const equipment = this.entity.getComponent(EquipmentComponent);
        if (equipment && equipment.mainItem) {
            items.push({
                text: "Main",
                onClick: ()=>{
                    this.onMainItemTap();
                },
                icon: equipment.mainItem.asset
            });
        } else {
            items.push({
                text: "Main",
                onClick: ()=>{
                    this.onMainItemTap();
                },
                icon: sprites2.empty_sprite
            });
        }
        if (equipment && equipment.otherItem) {
            items.push({
                text: "Other",
                icon: equipment.otherItem.asset
            });
        } else {
            items.push({
                text: "Other",
                icon: sprites2.empty_sprite
            });
        }
        return items;
    }
    onMainItemTap() {
        if (!this.presenter) {
            throw new Error("Presenter not set");
        }
        this.expandedMenuState = true;
        this.presenter.setExpandedMenu([
            {
                text: "Unequip"
            },
            {
                text: "Attack"
            }
        ]);
    }
    constructor(entity){
        super();
        _define_property(this, "entity", void 0);
        _define_property(this, "presenter", void 0);
        _define_property(this, "expandedMenuState", void 0);
        this.entity = entity;
        this.presenter = null;
        this.expandedMenuState = false;
    }
}
