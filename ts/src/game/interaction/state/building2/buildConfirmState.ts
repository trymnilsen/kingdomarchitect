import { sprites2 } from "../../../../asset/sprite.js";
import { Point } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Building } from "../../../../data/building/building.js";
import { woodResourceItem } from "../../../../data/inventory/items/resources.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { BuildingComponent } from "../../../component/building/buildingComponent.js";
import { HealthComponent } from "../../../component/health/healthComponent.js";
import { JobQueueComponent } from "../../../component/job/jobQueueComponent.js";
import { BuildJob } from "../../../component/job/jobs/buildJob.js";
import { ChunkMapComponent } from "../../../component/root/chunk/chunkMapComponent.js";
import { TilesComponent } from "../../../component/tile/tilesComponent.js";
import { buildingFactory } from "../../../prefab/buildingFactory.js";
import { GroundTile } from "../../../map/tile.js";
import { TileSize } from "../../../map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { BuildMode } from "./mode/buildMode.js";
import { LineBuildMode } from "./mode/lineBuildMode.js";
import { SingleBuildMode } from "./mode/singleBuildMode.js";
import { buildingApplicabilityList } from "./buildingApplicabilityList.js";
import { BuildingApplicabilityResult } from "./buildingApplicability.js";
import { firstMap as firstMapOrNull } from "../../../../common/array.js";

export class BuildConfirmState extends InteractionState {
    private scaffold: UIActionbarScaffold | null = null;
    private blinkScaffold = true;
    private buildMode: BuildMode;
    private selection: SelectedTile[] = [];

    constructor(
        private building: Building,
        private cursorPosition: Point,
    ) {
        super();
        this.buildMode = new SingleBuildMode(cursorPosition);
    }

    override onActive(): void {
        const cursorPosition = this.buildMode.cursorSelection();
        this.selection = [
            {
                isAvailable: this.isTileAvailable(cursorPosition).isApplicable,
                x: cursorPosition.x,
                y: cursorPosition.y,
            },
        ];

        const actions: UIActionbarItem[] = this.getActionItems();
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffold = new UIActionbarScaffold(contentView, actions, [], {
            width: fillUiSize,
            height: fillUiSize,
        });
        this.scaffold = scaffold;
        this.view = scaffold;
    }

    private getActionItems(): UIActionbarItem[] {
        return [
            {
                text: "Confirm",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.confirmBuildSelection();
                },
            },
            {
                text: this.buildMode.description.name,
                icon: sprites2.empty_sprite,
                children: [
                    {
                        text: "Single",
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            this.changeBuildMode(
                                new SingleBuildMode(
                                    this.buildMode.cursorSelection(),
                                ),
                            );
                        },
                    },
                    {
                        text: "Line",
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            this.changeBuildMode(
                                new LineBuildMode(
                                    this.buildMode.cursorSelection(),
                                ),
                            );
                        },
                    },
                ],
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.cancel();
                },
            },
        ];
    }

    private confirmBuildSelection() {
        const rootEntity = this.context.root;

        /*
        const inventoryComponent = rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component of root entity");
        }*/

        const selections = this.buildMode.getSelection();
        if (selections.length == 0) {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "No selection"),
            );
            return;
        }

        const tileError = firstMapOrNull(selections, (value) => {
            const isAvailable = this.isTileAvailable(value);
            if (isAvailable.isApplicable) {
                return null;
            } else {
                return isAvailable;
            }
        });

        if (!!tileError) {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", tileError.reason),
            );
            return;
        }

        const removeResult = true;
        /*inventoryComponent.removeInventoryItem(
            woodResourceItem.id,
            10 * selections.length,
        );*/

        if (removeResult) {
            for (const selection of selections) {
                const house = buildingFactory(this.building);
                house.position = selection;
                const root = this.context.root;
                root.addChild(house);
                const buildingComponent =
                    house.requireComponent(BuildingComponent);
                root.requireComponent(JobQueueComponent).addJob(
                    new BuildJob(buildingComponent),
                );
            }

            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("N/A", "TODO"),
            );
        }
    }

    private changeBuildMode(mode: BuildMode) {
        this.buildMode = mode;
        this.scaffold?.setLeftMenu(this.getActionItems());
    }

    private cancel() {
        this.context.stateChanger.clear();
    }

    override onTap(_screenPosition: Point, worldPosition: Point): boolean {
        const isTileAtPosition = this.context.root
            .requireComponent(TilesComponent)
            .getTile(worldPosition);

        return false;
    }

    override onTileTap(tile: GroundTile): boolean {
        const position = {
            x: tile.tileX,
            y: tile.tileY,
        };

        this.buildMode.setSelection(position);
        const newSelection = this.buildMode.getSelection();
        this.selection = newSelection.map((selectedTile) => {
            const tileIsAvailable = this.isTileAvailable(selectedTile);

            return {
                isAvailable: tileIsAvailable.isApplicable,
                x: selectedTile.x,
                y: selectedTile.y,
            };
        });

        return true;
    }

    override onUpdate(): void {
        this.blinkScaffold = !this.blinkScaffold;
    }

    override onDraw(context: RenderScope): void {
        for (const selection of this.selection) {
            const buildingPosition =
                context.camera.tileSpaceToScreenSpace(selection);

            if (this.blinkScaffold) {
                context.drawScreenSpaceSprite({
                    x: buildingPosition.x + 4,
                    y: buildingPosition.y + 4,
                    sprite: this.building.icon,
                    targetWidth: 32,
                    targetHeight: 32,
                });
            }

            const cursorWidth = TileSize;
            const cursorHeight = TileSize;

            context.drawNinePatchSprite({
                sprite: selection.isAvailable
                    ? sprites2.cursor
                    : sprites2.cursor_red,
                height: cursorHeight,
                width: cursorWidth,
                scale: 1.0,
                sides: allSides(12.0),
                x: buildingPosition.x,
                y: buildingPosition.y,
            });
        }

        super.onDraw(context);
    }

    private isTileAvailable(tilePosition: Point): BuildingApplicabilityResult {
        const rootEntity = this.context.root;
        const entitiesAt = rootEntity
            .requireComponent(ChunkMapComponent)
            .getEntityAt(tilePosition);

        if (entitiesAt.length > 0) {
            return {
                isApplicable: false,
                reason: "Spot taken",
            };
        }

        const tile = rootEntity
            .requireComponent(TilesComponent)
            .getTile(tilePosition);

        if (!tile) {
            return {
                isApplicable: false,
                reason: "No land",
            };
        }

        const buildingApplicabilityCheck =
            buildingApplicabilityList[this.building.id];

        if (buildingApplicabilityCheck) {
            const applicabilityResult = buildingApplicabilityCheck(
                tilePosition,
                this.context.root,
            );

            if (!applicabilityResult.isApplicable) {
                return applicabilityResult;
            }
        }

        return {
            isApplicable: true,
        };
    }
}

type SelectedTile = {
    isAvailable: boolean;
    x: number;
    y: number;
};
