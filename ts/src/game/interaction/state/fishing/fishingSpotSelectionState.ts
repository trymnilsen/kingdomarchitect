import { spriteRefs } from "../../../../asset/sprite.ts";
import { type Point } from "../../../../common/point.ts";
import type { RenderScope } from "../../../../rendering/renderScope.ts";
import { SetPlayerCommand } from "../../../../server/message/command/setPlayerCommand.ts";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    checkFishingSpot,
    type FishingSpotCheck,
} from "../../../fishing/checkFishingSpot.ts";
import { type GroundTile } from "../../../map/tile.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { drawSelectionCursor } from "../drawSelectionCursor.ts";
import { selectionInfoPanel } from "../selection/selectionInfoPanel.ts";
import { uiScaffold, type ScaffoldButton } from "../../view/uiScaffold.ts";

type TappedSpot = {
    point: Point;
    check: FishingSpotCheck;
};

// The panel says why a spot was refused, so a red cursor is never the only answer
export class FishingSpotSelectionState extends InteractionState {
    private tapped: TappedSpot | null = null;
    private entity: Entity;

    override get stateName(): string {
        return "Select fishing spot";
    }

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    override getView(): ComponentDescriptor | null {
        const buttons: ScaffoldButton[] = [];
        if (this.tapped?.check.isFishingSpot) {
            buttons.push({
                text: "Fish",
                onClick: () => {
                    this.fish();
                },
            });
        }
        buttons.push({
            text: "Cancel",
            onClick: () => {
                this.context.stateChanger.pop(null);
            },
        });
        return uiScaffold({
            leftButtons: buttons,
            content: spotPanel(this.tapped),
        });
    }

    override onTileTap(tile: GroundTile): boolean {
        const point = { x: tile.tileX, y: tile.tileY };
        this.tapped = {
            point,
            check: checkFishingSpot(this.context.root, point),
        };
        return true;
    }

    override onDraw(context: RenderScope): void {
        drawSelectionCursor(
            context,
            this.tapped?.point ?? null,
            this.tapped?.check.isFishingSpot ?? false,
        );
        super.onDraw(context);
    }

    private fish() {
        if (!this.tapped?.check.isFishingSpot) {
            return;
        }
        this.context.commandDispatcher(
            SetPlayerCommand(this.entity.id, {
                action: "fish",
                target: this.tapped.point,
            }),
        );
        this.context.stateChanger.clear();
    }
}

function spotPanel(tapped: TappedSpot | null): ComponentDescriptor {
    if (!tapped) {
        return selectionInfoPanel({
            icon: spriteRefs.fish,
            title: "Pick a spot",
            subtitle: "Water at the edge of the bank",
        });
    }
    if (!tapped.check.isFishingSpot) {
        return selectionInfoPanel({
            icon: spriteRefs.fish,
            title: "Can't fish here",
            subtitle: tapped.check.reason,
        });
    }
    return selectionInfoPanel({
        icon: spriteRefs.fish,
        title: "Fishing spot",
        subtitle: "The worker will cast from the bank",
    });
}
