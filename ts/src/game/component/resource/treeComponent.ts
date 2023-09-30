import { sprites2 } from "../../../asset/sprite.js";
import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
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
}

export class TreeComponent extends EntityComponent<TreeBundle> {
    private chopTime?: number;
    private tree = 1;
    private previousTick = 0;
    private chopState: TreeComponentChopState = TreeComponentChopState.Full;

    static createInstance(tree: number): TreeComponent {
        const instance = new TreeComponent();
        instance.fromComponentBundle({
            tree: tree,
            previousTick: 0,
            chopState: TreeComponentChopState.Full,
        });

        return instance;
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

    override fromComponentBundle(bundle: TreeBundle): void {
        this.chopState = bundle.chopState;
        this.chopTime = bundle.chopTime;
        this.previousTick = bundle.previousTick;
        this.tree = bundle.tree;
    }

    override toComponentBundle(): TreeBundle {
        return {
            chopState: this.chopState,
            chopTime: this.chopTime,
            previousTick: this.previousTick,
            tree: this.tree,
        };
    }
}
