import { sprites2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { EntityComponent } from "../entityComponent";
import { HealthComponent } from "../health/healthComponent";

export enum TreeComponentChopState {
    Chopping,
    Stub,
    Clearing,
    Full,
}

export class TreeComponent extends EntityComponent {
    private chopTime?: number;
    private previousTick: number = 0;
    private chopState: TreeComponentChopState = TreeComponentChopState.Full;
    constructor(private tree: number) {
        super();
    }
    startChop() {
        if (this.chopState == TreeComponentChopState.Stub) {
            this.chopState = TreeComponentChopState.Clearing;
        } else {
            this.chopState = TreeComponentChopState.Chopping;
        }
    }

    finishChop() {
        if (this.chopState == TreeComponentChopState.Chopping) {
            this.chopTime = this.previousTick;
            this.chopState = TreeComponentChopState.Stub;
        } else if (this.chopState == TreeComponentChopState.Clearing) {
            this.entity?.remove();
        }
    }

    override onUpdate(tick: number): void {
        this.previousTick = tick;
        if (!!this.chopTime && this.chopState == TreeComponentChopState.Stub) {
            const timeDifference = tick - this.chopTime;
            if (timeDifference > 30) {
                this.chopTime = undefined;
                this.chopState = TreeComponentChopState.Full;
                const health = this.entity?.getComponent(HealthComponent);
                if (!!health) {
                    health.healToMax();
                } else {
                    console.error(
                        "No health component found on entity, cannot heal",
                        this
                    );
                }
            }
        }
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
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

        if (!!this.chopTime) {
            sprite = sprites2.tree_stub;
        }

        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 4,
            y: screenPosition.y,
        });
    }
}
