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
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../../ui/uiSize.js";
import { EntityInstanceJobConstraint } from "../../../../world/job/constraint/entityInstanceConstraint.js";
import { MoveJob } from "../../../../world/job/jobs/moveJob.js";
import { TileSize } from "../../../../world/tile/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
export class ActorMovementState extends InteractionState {
    onActive() {
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize
        });
        const scaffoldView = new UIActionbarScaffold(contentView, [
            {
                text: "Move",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.scheduleMovement();
                    this.context.stateChanger.pop(null);
                }
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.context.stateChanger.pop(null);
                }
            }
        ], [], {
            width: fillUiSize,
            height: fillUiSize
        });
        this.view = scaffoldView;
    }
    onTileTap(tile) {
        const toPoint = {
            x: tile.tileX,
            y: tile.tileY
        };
        this.selectedPoint = toPoint;
        const path = this.context.world.pathFinding.findPath(this.entity.worldPosition, toPoint);
        this.graph = path.graph;
        this.path = path.path;
        return true;
    }
    onDraw(context) {
        for (const pathPoint of this.path){
            context.drawRectangle({
                x: pathPoint.x * TileSize + 14,
                y: pathPoint.y * TileSize + 14,
                width: 8,
                height: 8,
                fill: "pink"
            });
        }
        if (this.selectedPoint) {
            const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(this.selectedPoint);
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
        for (const searchedNode of this.graph){
            const position = context.camera.tileSpaceToScreenSpace({
                x: searchedNode.x,
                y: searchedNode.y
            });
            if (searchedNode.visited) {
                context.drawScreenSpaceRectangle({
                    x: position.x,
                    y: position.y,
                    width: 4,
                    height: 4,
                    fill: "blue"
                });
            }
            if (searchedNode.weight == 0) {
                context.drawScreenSpaceRectangle({
                    x: position.x + 4,
                    y: position.y,
                    width: 4,
                    height: 4,
                    fill: "red"
                });
            }
            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y,
                text: `c: ${searchedNode.totalCost}`
            });
            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y + 12,
                text: `w: ${searchedNode.weight}`
            });
            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y + 24,
                text: `${searchedNode.x},${searchedNode.y}`
            });
        }
        super.onDraw(context);
    }
    scheduleMovement() {
        this.context.world.jobQueue.schedule(new MoveJob(this.path, new EntityInstanceJobConstraint(this.entity)));
    }
    constructor(entity){
        super();
        _define_property(this, "entity", void 0);
        _define_property(this, "selectedPoint", void 0);
        _define_property(this, "path", void 0);
        _define_property(this, "graph", void 0);
        this.entity = entity;
        this.selectedPoint = null;
        this.path = [];
        this.graph = [];
    }
}
