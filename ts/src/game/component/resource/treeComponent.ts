import { sprites2, type Sprite2 } from "../../../module/asset/sprite.js";
import { Point } from "../../../common/point.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthComponent } from "../health/healthComponent.js";

export enum TreeComponentChopState {
    Chopping,
    Full,
}

type TreeBundle = {
    chopTime?: number;
    tree: number;
    previousTick: number;
    chopState: TreeComponentChopState;
};

export class TreeComponent extends EntityComponent {
    private chopTime?: number;
    private previousTick = 0;
    private chopState: TreeComponentChopState = TreeComponentChopState.Full;

    constructor(private tree: number) {
        super();
    }

    startChop() {
        this.chopState = TreeComponentChopState.Chopping;
    }

    finishChop() {
        this.chopTime = this.previousTick;
        this.entity?.remove();
    }

    override onUpdate(tick: number): void {
        this.previousTick = tick;
    }

    override onDraw(context: RenderScope, screenPosition: Point): void {
        const health = this.entity?.getComponent(HealthComponent);

        if (!health) {
            console.warn("No health component");
        }

        let sprite = sprites2.tree_1;
        if (this.tree >= 2.0) {
            sprite = sprites2.tree_2;
        }
        if (this.tree >= 3.0) {
            sprite = sprites2.tree_3;
        }

        if (this.chopTime) {
            sprite = sprites2.tree_stub;
        }

        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 4,
            y: screenPosition.y,
            targetWidth: 32,
            targetHeight: 32,
        });
    }
}

export function getTreeSprite(variation: number): Sprite2 {
    let sprite = sprites2.tree_1;
    if (variation >= 2.0) {
        sprite = sprites2.tree_2;
    }
    if (variation >= 3.0) {
        sprite = sprites2.tree_3;
    }
    return sprite;
}
