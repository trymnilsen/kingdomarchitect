import { sprites2 } from "../../../../asset/sprite.js";
import type { Point } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import type { RenderScope } from "../../../../rendering/renderScope.js";
import { AttackCommand } from "../../../../server/message/command/attackTargetCommand.js";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.js";
import { HealthComponentId } from "../../../component/healthComponent.js";
import type { Entity } from "../../../entity/entity.js";
import type { SearchedNode } from "../../../map/path/search.js";
import { queryPath } from "../../../map/query/pathQuery.js";
import { queryEntity } from "../../../map/query/queryEntity.js";
import { TileSize, type GroundTile } from "../../../map/tile.js";
import { InteractionState } from "../../handler/interactionState";
import { uiScaffold } from "../../view/uiScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";

export class AttackSelectionState extends InteractionState {
    private selectedPoint: Point | null = null;
    private selection: Entity | null = null;
    override get stateName(): string {
        return "Select target";
    }

    /**
     * @param entity The entity that performs the attack
     */
    constructor(private entity: Entity) {
        super();
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    text: "Attack",
                    onClick: () => {
                        this.attack();
                    },
                },
                {
                    text: "Cancel",
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
        });
    }

    override onTileTap(tile: GroundTile): boolean {
        const toPoint = {
            x: tile.tileX,
            y: tile.tileY,
        };

        this.selectedPoint = toPoint;
        const entity = queryEntity(
            this.context.camera.currentScene,
            toPoint,
        ).filter((item) => item.hasComponent(HealthComponentId));
        if (entity.length) {
            this.selection = entity[0];
        } else {
            this.selection = null;
        }

        return true;
    }

    override onDraw(context: RenderScope): void {
        if (this.selectedPoint) {
            const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
                this.selectedPoint,
            );

            context.drawNinePatchSprite({
                sprite: this.selection ? sprites2.cursor : sprites2.cursor_red,
                height: TileSize,
                width: TileSize,
                scale: 1.0,
                sides: allSides(12.0),
                x: cursorWorldPosition.x,
                y: cursorWorldPosition.y,
            });
        }

        super.onDraw(context);
    }

    private attack() {
        if (this.selection) {
            this.context.commandDispatcher(
                AttackCommand(this.selection, this.entity),
            );
            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("No target", "Nothing to attack there"),
            );
        }
    }
}
