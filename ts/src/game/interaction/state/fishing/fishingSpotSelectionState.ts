import { spriteRefs } from "../../../../asset/sprite.ts";
import { type Point } from "../../../../common/point.ts";
import { SetPlayerCommand } from "../../../../server/message/command/setPlayerCommand.ts";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    checkFishingSpot,
    type FishingSpotCheck,
} from "../../../fishing/checkFishingSpot.ts";
import { CursorSelectionBaseState } from "../common/cursorSelectionBaseState.ts";
import { selectionInfoPanel } from "../selection/selectionInfoPanel.ts";
import { uiScaffold, type ScaffoldButton } from "../../view/uiScaffold.ts";

// The panel says why a spot was refused, so a red cursor is never the only answer
export class FishingSpotSelectionState extends CursorSelectionBaseState {
    private check: FishingSpotCheck | null = null;
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
        if (this.check?.isFishingSpot) {
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
            content: spotPanel(this.check),
        });
    }

    protected override onPick(point: Point): boolean {
        this.check = checkFishingSpot(this.context.root, point);
        return true;
    }

    protected override isPickValid(): boolean {
        return this.check?.isFishingSpot ?? false;
    }

    private fish() {
        const target = this.pickedTile;
        if (!target || !this.check?.isFishingSpot) {
            return;
        }
        this.context.commandDispatcher(
            SetPlayerCommand(this.entity.id, {
                action: "fish",
                target,
            }),
        );
        this.context.stateChanger.clear();
    }
}

function spotPanel(check: FishingSpotCheck | null): ComponentDescriptor {
    if (!check) {
        return selectionInfoPanel({
            icon: spriteRefs.fish,
            title: "Pick a spot",
            subtitle: "Water at the edge of the bank",
        });
    }
    if (!check.isFishingSpot) {
        return selectionInfoPanel({
            icon: spriteRefs.fish,
            title: "Can't fish here",
            subtitle: check.reason,
        });
    }
    return selectionInfoPanel({
        icon: spriteRefs.fish,
        title: "Fishing spot",
        subtitle: "The worker will cast from the bank",
    });
}
