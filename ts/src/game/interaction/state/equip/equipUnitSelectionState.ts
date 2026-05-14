import { spriteRefs } from "../../../../asset/sprite.ts";
import type { Point } from "../../../../common/point.ts";
import { allSides } from "../../../../common/sides.ts";
import type { RenderScope } from "../../../../rendering/renderScope.ts";
import { EquipItemCommand } from "../../../../server/message/command/equipItemCommand.ts";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { EquipmentComponentId } from "../../../component/equipmentComponent.ts";
import { PlayerUnitComponentId } from "../../../component/playerUnitComponent.ts";
import type { Entity } from "../../../entity/entity.ts";
import { queryEntity } from "../../../map/query/queryEntity.ts";
import { TileSize, type GroundTile } from "../../../map/tile.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { AlertMessageState } from "../common/alertMessageState.ts";

/**
 * Tap-a-unit selection state for the equip flow. Started from a stockpile
 * inventory or ground-pile selection — the player has already chosen the
 * source, the item, and the slot. Tapping a friendly equippable unit
 * dispatches an EquipItemCommand routing the worker through the equip
 * planner.
 */
export class EquipUnitSelectionState extends InteractionState {
    private selectedPoint: Point | null = null;
    private selection: Entity | null = null;
    private readonly sourceEntityId: string;
    private readonly itemId: string;
    private readonly slot: "primary" | "secondary";

    constructor(
        sourceEntityId: string,
        itemId: string,
        slot: "primary" | "secondary",
    ) {
        super();
        this.sourceEntityId = sourceEntityId;
        this.itemId = itemId;
        this.slot = slot;
    }

    override get stateName(): string {
        return "Select unit to equip";
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    text: "Equip",
                    onClick: () => this.equip(),
                },
                {
                    text: "Cancel",
                    onClick: () => this.context.stateChanger.pop(null),
                },
            ],
        });
    }

    override onTileTap(tile: GroundTile): boolean {
        const point = { x: tile.tileX, y: tile.tileY };
        this.selectedPoint = point;
        const candidates = queryEntity(this.context.root, point).filter(
            (entity) =>
                entity.hasComponent(EquipmentComponentId) &&
                entity.hasComponent(PlayerUnitComponentId),
        );
        this.selection = candidates[0] ?? null;
        return true;
    }

    override onDraw(context: RenderScope): void {
        if (this.selectedPoint) {
            const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
                this.selectedPoint,
            );
            context.drawNinePatchSprite({
                sprite: this.selection
                    ? spriteRefs.cursor
                    : spriteRefs.cursor_red,
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

    private equip() {
        if (!this.selection) {
            this.context.stateChanger.push(
                new AlertMessageState(
                    "No target",
                    "Tap a friendly unit with equipment slots first",
                ),
            );
            return;
        }
        this.context.commandDispatcher(
            EquipItemCommand(
                this.selection,
                this.sourceEntityId,
                this.itemId,
                this.slot,
            ),
        );
        this.context.stateChanger.clear();
    }
}
