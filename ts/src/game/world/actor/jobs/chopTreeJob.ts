import { generateId } from "../../../../common/idGenerator";
import { woodResourceItem } from "../../../../data/inventory/resources";
import { RenderContext } from "../../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation";
import { HealthComponent } from "../../component/health/healthComponent";
import { TreeComponent } from "../../component/resource/treeComponent";
import { InventoryComponent } from "../../component/root/inventory/inventoryComponent";
import { TilesComponent } from "../../component/tile/tilesComponent";
import { Entity } from "../../entity/entity";
import { treePrefab } from "../../prefab/treePrefab";
import { SelectedEntityItem } from "../../selection/selectedEntityItem";
import { SelectedTileItem } from "../../selection/selectedTileItem";
import { SelectedWorldItem } from "../../selection/selectedWorldItem";
import { TileSize } from "../../tile/tile";
import { WorkerConstraint } from "../job/constraint/workerConstraint";
import { Job } from "../job/job";
import { JobConstraintsError } from "../job/jobConstraintsError";
import { MoveToBeforeJob } from "./moveToBeforeJob";

/**
 * Represents a multistep job that will move towards a tree and then chop
 * it down. If the tree is adjacent to the actor doing it, the moving part will
 * be skipped.
 */

export class ChopTreeJob extends MoveToBeforeJob {
    constructor(public target: SelectedWorldItem) {
        super(new _ChopTreeJob(target), new WorkerConstraint());
    }

    override onDraw(renderContext: RenderContext): void {
        let visualPosition = renderContext.camera.tileSpaceToWorldSpace(
            this.target.tilePosition
        );

        renderContext.drawRectangle({
            x: visualPosition.x + 4,
            y: visualPosition.y + 4,
            height: TileSize - 10,
            width: TileSize - 10,
            strokeColor: "yellow",
            strokeWidth: 2,
        });

        super.onDraw(renderContext);
    }
}

class _ChopTreeJob extends Job {
    private target: SelectedWorldItem;
    private treeEntity?: Entity;
    private blinkingAnimation: BlinkingImageAnimation;

    get tileX(): number {
        return this.target.tilePosition.x;
    }

    get tileY(): number {
        return this.target.tilePosition.y;
    }

    constructor(target: SelectedWorldItem) {
        super();
        const validSelection =
            target instanceof SelectedTileItem ||
            target instanceof SelectedEntityItem;

        if (!validSelection) {
            throw new JobConstraintsError(
                "Invalid selected provided for chopTreeJob"
            );
        }
        this.target = target;
        this.blinkingAnimation = new BlinkingImageAnimation({
            x: 0,
            y: 0,
            image: "swipe_effect",
        });
    }

    override onStart(): void {
        super.onStart();
        //Check if we need to convert the tile with a tree into a tile without
        //a tree to a tree entity (to keep track of chopping progress etc
        let entity: Entity | undefined;
        if (this.target instanceof SelectedEntityItem) {
            entity = this.target.entity;
        }

        if (this.target instanceof SelectedTileItem) {
            const tileComponent =
                this.entity.getAncestorComponent(TilesComponent);

            if (!tileComponent) {
                throw new JobConstraintsError("No tile component found");
            }

            const tile = tileComponent.getTile(this.target.tilePosition);

            if (!!tile?.hasTree) {
                const treeEntity = treePrefab(generateId("tree"), tile.hasTree);
                tile.hasTree = 0;
                treeEntity.worldPosition = this.target.tilePosition;
                tileComponent.entity?.addChild(treeEntity, 0);
                entity = treeEntity;
            } else {
                throw new JobConstraintsError("No tree at selection");
            }
        }

        if (!entity) {
            throw new JobConstraintsError("No entity for selection");
        }

        this.treeEntity = entity;
    }

    update(tick: number): void {
        const entity = this.treeEntity;
        if (!entity) {
            return;
        }

        const healthComponent = entity.getComponent(HealthComponent)!;
        const treeComponent = entity.getComponent(TreeComponent)!;

        const inventoryComponent =
            entity.getAncestorComponent(InventoryComponent)!;

        if (healthComponent.health >= 20) {
            healthComponent.damage(10);
        }
        if (healthComponent.health <= 10) {
            treeComponent.setChopped();
            inventoryComponent.addInventoryItem(woodResourceItem, 4);
            this.complete();
        }
    }

    override onDraw(renderContext: RenderContext) {
        const worldSpacePosition = renderContext.camera.tileSpaceToWorldSpace(
            this.target.tilePosition
        );

        this.blinkingAnimation.updatePosition({
            x: worldSpacePosition.x,
            y: worldSpacePosition.y,
        });

        this.blinkingAnimation.onDraw(renderContext);
    }
}
