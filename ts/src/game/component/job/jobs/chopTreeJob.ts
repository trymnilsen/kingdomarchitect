import { sprites2 } from "../../../../asset/sprite.js";
import { woodResourceItem } from "../../../../data/inventory/items/resources.js";
import { RenderScope } from "../../../../rendering/renderContext.js";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation.js";
import { HealthComponent } from "../../../component/health/healthComponent.js";
import { InventoryComponent2 } from "../../../component/inventory/inventoryComponent.js";
import { TreeComponent } from "../../../component/resource/treeComponent.js";
import { Entity, assertEntity } from "../../../entity/entity.js";
import { assertEntityComponent } from "../../entityComponent.js";
import { MovementComponent } from "../../movement/movementComponent.js";
import { IsWorkerJobConstraint } from "../constraint/isWorkerJobConstraint.js";
import { Job } from "../job.js";

type ChopTreeBundle = {
    targetEntityId: string;
};

/**
 * Represents a multistep job that will move towards a tree and then chop
 * it down. If the tree is adjacent to the actor doing it, the moving part will
 * be skipped.
 */
export class ChopTreeJob extends Job {
    private _target: Entity;
    private healthComponent: HealthComponent;
    private blinkingAnimation: BlinkingImageAnimation =
        new BlinkingImageAnimation({
            x: 0,
            y: 0,
            sprite: sprites2.swipe_effect,
        });

    get target(): Readonly<Entity | null> {
        return this._target;
    }

    constructor(entity: Entity) {
        super([new IsWorkerJobConstraint()]);
        this._target = entity;
        this.healthComponent = entity.requireComponent(HealthComponent);
    }

    override onStart(): void {
        super.onStart();
        this._target.requireComponent(TreeComponent).startChop();
    }

    update(): void {
        if (this.adjacentTo(this._target.worldPosition)) {
            if (this.healthComponent.health >= 20) {
                console.log("Health mte 20");
                this.healthComponent.damage(10, this.entity);
            }

            if (this.healthComponent.health <= 10) {
                console.log("Health lte 10");
                const treeComponent =
                    this._target.requireComponent(TreeComponent);
                const inventoryComponent =
                    this.entity.getComponent(InventoryComponent2);
                if (!inventoryComponent) {
                    throw new Error(
                        "No inventory component on ancestor of entity for ChopTreeJob",
                    );
                }

                treeComponent.finishChop();

                inventoryComponent.addInventoryItem(woodResourceItem, 4);
                this.complete();
            }
        } else {
            const movementComponent =
                this.entity.requireComponent(MovementComponent);

            movementComponent.pathTo(this._target.worldPosition);
        }
    }

    override onDraw(renderContext: RenderScope) {
        if (!this._target) {
            return;
        }
        assertEntity(this._target);
        const worldSpacePosition = renderContext.camera.tileSpaceToWorldSpace(
            this._target.worldPosition,
        );

        this.blinkingAnimation.updatePosition({
            x: worldSpacePosition.x,
            y: worldSpacePosition.y,
        });

        this.blinkingAnimation.onDraw(renderContext);
    }
}
