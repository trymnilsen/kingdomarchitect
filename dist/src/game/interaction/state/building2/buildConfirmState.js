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
import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { woodResourceItem } from "../../../../data/inventory/resources.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { InventoryComponent } from "../../../world/component/inventory/inventoryComponent.js";
import { TilesComponent } from "../../../world/component/tile/tilesComponent.js";
import { BuildJob } from "../../../world/job/jobs/buildJob.js";
import { buildingFactory } from "../../../world/prefab/buildingFactory.js";
import { TileSize } from "../../../world/tile/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { LineBuildMode } from "./mode/lineBuildMode.js";
import { SingleBuildMode } from "./mode/singleBuildMode.js";
export class BuildConfirmState extends InteractionState {
    onActive() {
        const cursorPosition = this.buildMode.cursorSelection();
        this.selection = [
            {
                isAvailable: this.isTileAvailable(cursorPosition),
                x: cursorPosition.x,
                y: cursorPosition.y
            }
        ];
        const actions = this.getActionItems();
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize
        });
        const scaffold = new UIActionbarScaffold(contentView, actions, [], {
            width: fillUiSize,
            height: fillUiSize
        });
        this.scaffold = scaffold;
        this.view = scaffold;
    }
    getActionItems() {
        return [
            {
                text: "Confirm",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.confirmBuildSelection();
                }
            },
            {
                text: this.buildMode.description.name,
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    if (this.scaffold?.isExpanded) {
                        this.scaffold.resetExpandedMenu();
                    } else {
                        this.onBuildModeSelected();
                    }
                }
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.cancel();
                }
            }
        ];
    }
    onBuildModeSelected() {
        this.scaffold?.setLeftExpandedMenu([
            {
                text: "Single",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.changeBuildMode(new SingleBuildMode(this.buildMode.cursorSelection()));
                }
            },
            {
                text: "Line",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.changeBuildMode(new LineBuildMode(this.buildMode.cursorSelection()));
                }
            }
        ], 1);
    }
    confirmBuildSelection() {
        const rootEntity = this.context.world.rootEntity;
        const inventoryComponent = rootEntity.getComponent(InventoryComponent);
        if (!inventoryComponent) {
            throw new Error("No inventory component of root entity");
        }
        const selections = this.buildMode.getSelection();
        const isAllTilesAvailable = selections.every((item)=>{
            return this.isTileAvailable(item);
        });
        if (!isAllTilesAvailable) {
            this.context.stateChanger.push(new AlertMessageState("Oh no", "Spot taken"));
            return;
        }
        const removeResult = inventoryComponent.removeInventoryItem(woodResourceItem.id, 10 * selections.length);
        if (removeResult) {
            for (const selection of selections){
                const house = buildingFactory(this.building);
                house.position = selection;
                this.context.world.rootEntity.addChild(house);
                this.context.world.jobQueue.schedule(new BuildJob(house));
            }
            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(new AlertMessageState("Oh no", "Not enough resources"));
        }
    }
    changeBuildMode(mode) {
        this.buildMode = mode;
        this.scaffold?.resetExpandedMenu();
        this.scaffold?.setLeftMenu(this.getActionItems());
    }
    cancel() {
        this.context.stateChanger.clear();
    }
    onTap(screenPosition, worldPosition) {
        const isTileAtPosition = this.context.world.ground.getTile(worldPosition);
        if (this.scaffold?.isExpanded && isTileAtPosition) {
            this.scaffold.resetExpandedMenu();
            return true;
        } else {
            return false;
        }
    }
    onTileTap(tile) {
        if (this.scaffold?.isExpanded) {
            this.scaffold.resetExpandedMenu();
        }
        const position = {
            x: tile.tileX,
            y: tile.tileY
        };
        this.buildMode.setSelection(position);
        const newSelection = this.buildMode.getSelection();
        this.selection = newSelection.map((selectedTile)=>{
            const tileIsAvailable = this.isTileAvailable(selectedTile);
            return {
                isAvailable: tileIsAvailable,
                x: selectedTile.x,
                y: selectedTile.y
            };
        });
        return true;
    }
    onUpdate(tick) {
        this.blinkScaffold = !this.blinkScaffold;
    }
    onDraw(context) {
        for (const selection of this.selection){
            const buildingPosition = context.camera.tileSpaceToScreenSpace(selection);
            if (this.blinkScaffold) {
                context.drawScreenSpaceSprite({
                    x: buildingPosition.x + 4,
                    y: buildingPosition.y + 4,
                    sprite: this.building.icon,
                    targetWidth: 32,
                    targetHeight: 32
                });
            }
            const cursorWidth = TileSize;
            const cursorHeight = TileSize;
            context.drawNinePatchSprite({
                sprite: selection.isAvailable ? sprites2.cursor : sprites2.cursor_red,
                height: cursorHeight,
                width: cursorWidth,
                scale: 1.0,
                sides: allSides(12.0),
                x: buildingPosition.x,
                y: buildingPosition.y
            });
        }
        super.onDraw(context);
    }
    isTileAvailable(tilePosition) {
        const rootEntity = this.context.world.rootEntity;
        const entitiesAt = rootEntity.getEntityAt(tilePosition);
        const tile = rootEntity.getComponent(TilesComponent)?.getTile(tilePosition);
        const hasTree = tile?.hasTree;
        return entitiesAt.length == 0 && !!tile && !hasTree;
    }
    constructor(building){
        super();
        _define_property(this, "building", void 0);
        _define_property(this, "scaffold", void 0);
        _define_property(this, "blinkScaffold", void 0);
        _define_property(this, "buildMode", void 0);
        _define_property(this, "selection", void 0);
        this.building = building;
        this.scaffold = null;
        this.blinkScaffold = true;
        this.buildMode = new SingleBuildMode({
            x: 1,
            y: 1
        });
        this.selection = [];
    }
}
