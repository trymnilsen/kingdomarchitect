import { sprites2 } from "../../../../asset/sprite.js";
import { woodResourceItem } from "../../../../data/inventory/resources.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation.js";
import { HealthComponent } from "../../../component/health/healthComponent.js";
import { InventoryComponent } from "../../../component/inventory/inventoryComponent.js";
import { TreeComponent } from "../../../component/resource/treeComponent.js";
import { Entity, assertEntity } from "../../../entity/entity.js";
import { assertEntityComponent } from "../../entityComponent.js";
import { Job } from "../job.js";

type ChopTreeBundle = {
    targetEntityId: string;
};

/**
 * Represents a multistep job that will move towards a tree and then chop
 * it down. If the tree is adjacent to the actor doing it, the moving part will
 * be skipped.
 */
export class ChopTreeJob extends Job<ChopTreeBundle> {
    private _target: Entity | null = null;
    private healthComponent: HealthComponent | null = null;
    private blinkingAnimation: BlinkingImageAnimation =
        new BlinkingImageAnimation({
            x: 0,
            y: 0,
            sprite: sprites2.swipe_effect,
        });

    public get target(): Readonly<Entity | null> {
        return this._target;
    }

    static createInstance(tree: TreeComponent) {
        const instance = new ChopTreeJob();
        instance.bundle = {
            targetEntityId: tree.entity.id,
        };
        return instance;
    }

    override onStart(): void {
        super.onStart();
        assertEntity(this._target);
        this._target.requireComponent(TreeComponent).startChop();
    }

    update(tick: number): void {
        assertEntity(this._target);
        assertEntityComponent(this.healthComponent);

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
                    this._target.getAncestorComponent(InventoryComponent);
                if (!inventoryComponent) {
                    throw new Error(
                        "No inventory component on ancestor of entity for ChopTreeJob"
                    );
                }

                treeComponent.finishChop();

                inventoryComponent.addInventoryItem(woodResourceItem, 4);
                this.complete();
            }
        } else {
            this.movement.pathTowards(this._target.worldPosition);
        }
    }

    override onDraw(renderContext: RenderContext) {
        if (!this._target) {
            return;
        }
        assertEntity(this._target);
        const worldSpacePosition = renderContext.camera.tileSpaceToWorldSpace(
            this._target.worldPosition
        );

        this.blinkingAnimation.updatePosition({
            x: worldSpacePosition.x,
            y: worldSpacePosition.y,
        });

        this.blinkingAnimation.onDraw(renderContext);
    }

    protected override onPersistJobState(): ChopTreeBundle {
        return {
            targetEntityId: this.bundle!.targetEntityId,
        };
    }
    protected override onFromPersistedState(bundle: ChopTreeBundle): void {
        const entityWithId = this.entity
            .getRootEntity()
            .findEntity(bundle.targetEntityId);

        assertEntity(entityWithId);

        this._target = entityWithId;
        this.healthComponent = entityWithId.requireComponent(HealthComponent);
    }
}
