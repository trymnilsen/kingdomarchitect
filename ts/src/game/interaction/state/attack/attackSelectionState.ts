import { type Point } from "../../../../common/point.ts";
import type { RenderScope } from "../../../../rendering/renderScope.ts";
import { SetPlayerCommand } from "../../../../server/message/command/setPlayerCommand.ts";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import {
    AttackTargetKind,
    type AttackProfileDefinition,
} from "../../../../data/combat/attackProfileDefinition.ts";
import { attackFootprint } from "../../../combat/attackReach.ts";
import { resolveAttackProfile } from "../../../combat/resolveAttackProfile.ts";
import { findAttackableEntity } from "../../../combat/resolveTarget.ts";
import type { Entity } from "../../../entity/entity.ts";
import { type GroundTile } from "../../../map/tile.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { drawTileSetOverlay } from "../../overlay/drawTileSetOverlay.ts";
import { drawSelectionCursor } from "../drawSelectionCursor.ts";
import { uiScaffold, type ScaffoldButton } from "../../view/uiScaffold.ts";

const reachFillColor = "rgba(228, 96, 72, 0.14)";
const reachBoundaryColor = "rgba(228, 96, 72, 0.85)";

export class AttackSelectionState extends InteractionState {
    private selectedPoint: Point | null = null;
    private selection: Entity | null = null;
    private footprint: ReadonlySet<number> = new Set();
    private profile: AttackProfileDefinition;
    private entity: Entity;

    override get stateName(): string {
        return "Select target";
    }

    constructor(entity: Entity) {
        super();
        this.entity = entity;
        this.profile = resolveAttackProfile(entity);
    }

    override onActive(): void {
        this.refresh();
    }

    override onUpdate(_tick: number): void {
        // Every tick, not once on entry. The attacker can be shoved aside or
        // have a wall go up while the player is still deciding
        this.refresh();
    }

    override getView(): ComponentDescriptor | null {
        // Only once something attackable is picked, so there is nothing to
        // confirm until the tap landed on a target
        const buttons: ScaffoldButton[] = [];
        if (this.selection) {
            buttons.push({
                text: "Attack",
                onClick: () => {
                    this.attack();
                },
            });
        }
        buttons.push({
            text: "Cancel",
            onClick: () => {
                this.context.stateChanger.pop(null);
            },
        });
        return uiScaffold({ leftButtons: buttons });
    }

    override onTileTap(tile: GroundTile): boolean {
        const tappedPoint = { x: tile.tileX, y: tile.tileY };
        this.selectedPoint = tappedPoint;
        this.selection = this.findTarget(tappedPoint);
        return true;
    }

    override onDraw(context: RenderScope): void {
        drawTileSetOverlay(
            context,
            this.footprint,
            reachFillColor,
            reachBoundaryColor,
        );
        drawSelectionCursor(context, this.selectedPoint, !!this.selection);
        super.onDraw(context);
    }

    /** Re-reads everything the attacker's situation decides, once per tick */
    private refresh(): void {
        this.profile = resolveAttackProfile(this.entity);
        this.footprint = attackFootprint(
            this.context.root,
            this.profile,
            this.entity.worldPosition,
        );
    }

    /** What aiming here would hit, or null */
    private findTarget(point: Point): Entity | null {
        return findAttackableEntity(this.context.root, this.profile, point);
    }

    private attack() {
        if (!this.selection) {
            return;
        }
        this.context.commandDispatcher(
            SetPlayerCommand(this.entity.id, {
                action: "attack",
                target: {
                    kind: AttackTargetKind.Entity,
                    id: this.selection.id,
                },
            }),
        );
        this.context.stateChanger.clear();
    }
}
