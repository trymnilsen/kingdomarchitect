import { InvalidStateError } from "../../../../common/error/invalidStateError";
import { from } from "../../../../common/from";
import { generateId } from "../../../../common/idGenerator";
import {
    isPointAdjacentTo,
    Point,
    pointEquals,
} from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../../rendering/visual/blinkingImageAnimation";
import { TileSelectedItem } from "../../../interaction/state/selection/selectedItem";
import { EntityComponent } from "../../component/entityComponent";
import { HealthComponent } from "../../component/health/healthComponent";
import { TreeComponent } from "../../component/resource/treeComponent";
import { PathFindingComponent } from "../../component/root/path/pathFindingComponent";
import { TilesComponent } from "../../component/tile/tilesComponent";
import { Entity } from "../../entity/entity";
import { treePrefab } from "../../prefab/treePrefab";
import { SelectedEntityItem } from "../../selection/selectedEntityItem";
import { SelectedTileItem } from "../../selection/selectedTileItem";
import { SelectedWorldItem } from "../../selection/selectedWorldItem";
import { GroundTile } from "../../tile/ground";
import { TileSize } from "../../tile/tile";
import { WorkerConstraint } from "../job/constraint/workerConstraint";
import { Job } from "../job/job";
import { JobConstraintsError } from "../job/jobConstraintsError";
import { MultipleStepJob } from "../job/multipleStepJob";
import { MoveJob } from "./moveJob";
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
    private treeComponent?: TreeComponent;
    private treeHealthComponent?: HealthComponent | null;
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
        let component: TreeComponent | undefined;
        if (this.target instanceof SelectedEntityItem) {
            const entity = this.target.entity;
            const entityComponent = this.entity.getComponent(TreeComponent);
            if (entityComponent) {
                component = entityComponent;
            }
        }

        if (this.target instanceof SelectedTileItem) {
            const tileComponent =
                this.entity.getAncestorComponent(TilesComponent);

            if (tileComponent) {
                const tile = tileComponent.getTile(this.target.tilePosition);

                if (!!tile?.hasTree) {
                    const treeEntity = treePrefab(
                        generateId("tree"),
                        tile.hasTree
                    );
                    tile.hasTree = 0;
                    treeEntity.worldPosition = this.target.tilePosition;
                    tileComponent.entity?.addChild(treeEntity, 0);
                    component = treeEntity.getComponent(TreeComponent)!;
                } else {
                    throw new JobConstraintsError("No tree at selection");
                }
            } else {
                throw new JobConstraintsError("No tile component found");
            }
        }

        if (!component) {
            throw new JobConstraintsError("No tree component on selection");
        }
        this.treeHealthComponent =
            component.entity?.getComponent(HealthComponent);
        this.treeComponent = component;
    }

    update(tick: number): void {
        if (this.treeHealthComponent) {
            if (this.treeHealthComponent.health > 10) {
                this.treeHealthComponent.damage(1);
            }
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
