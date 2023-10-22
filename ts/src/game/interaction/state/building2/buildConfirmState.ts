import { sprites2 } from "../../../../asset/sprite.js";
import { Point } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Building } from "../../../../data/building/building.js";
import { woodResourceItem } from "../../../../data/inventory/resources.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { InventoryComponent } from "../../../component/inventory/inventoryComponent.js";
import { workerConstraint } from "../../../component/job/jobConstraint.js";
import { JobQueueComponent } from "../../../component/job/jobQueueComponent.js";
import { BuildJob } from "../../../component/job/jobs/buildJob.js";
import { ChunkMapComponent } from "../../../component/root/chunk/chunkMapComponent.js";
import { TilesComponent } from "../../../component/tile/tilesComponent.js";
import { buildingFactory } from "../../../prefab/buildingFactory.js";
import { GroundTile } from "../../../tile/ground.js";
import { TileSize } from "../../../tile/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { BuildMode } from "./mode/buildMode.js";
import { LineBuildMode } from "./mode/lineBuildMode.js";
import { SingleBuildMode } from "./mode/singleBuildMode.js";

export class BuildConfirmState extends InteractionState {
    private scaffold: UIActionbarScaffold | null = null;
    private blinkScaffold = true;
    private buildMode: BuildMode = new SingleBuildMode({ x: 1, y: 1 });
    private selection: SelectedTile[] = [];

    constructor(private building: Building) {
        super();
    }

    override onActive(): void {
        const cursorPosition = this.buildMode.cursorSelection();
        this.selection = [
            {
                isAvailable: this.isTileAvailable(cursorPosition),
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

    private onBuildModeSelected() {
        /*
        this.scaffold?.setLeftExpandedMenu(
            [
                {
                    text: "Single",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.changeBuildMode(
                            new SingleBuildMode(
                                this.buildMode.cursorSelection()
                            )
                        );
                    },
                },
                {
                    text: "Line",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.changeBuildMode(
                            new LineBuildMode(this.buildMode.cursorSelection())
                        );
                    },
                },
                /*
            {
                text: "Box",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.changeBuildMode(new BoxBuildMode());
                },
            },
            {
                text: "Toggle",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.changeBuildMode(new ToggleBuildMode());
                },
            },
            ],
            1
        );*/
    }

    private confirmBuildSelection() {
        const rootEntity = this.context.root;
        const inventoryComponent = rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component of root entity");
        }

        const selections = this.buildMode.getSelection();
        const isAllTilesAvailable = selections.every((item) => {
            return this.isTileAvailable(item);
        });

        if (!isAllTilesAvailable) {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Spot taken"),
            );
            return;
        }

        const removeResult = inventoryComponent.removeInventoryItem(
            woodResourceItem.id,
            10 * selections.length,
        );

        if (removeResult) {
            for (const selection of selections) {
                const house = buildingFactory(this.building);
                house.position = selection;
                const root = this.context.root;
                root.addChild(house);
                root.requireComponent(JobQueueComponent).addJob(
                    BuildJob.createInstance(house),
                    workerConstraint(),
                );
            }

            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Not enough resources"),
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
                isAvailable: tileIsAvailable,
                x: selectedTile.x,
                y: selectedTile.y,
            };
        });

        return true;
    }

    override onUpdate(): void {
        this.blinkScaffold = !this.blinkScaffold;
    }

    override onDraw(context: RenderContext): void {
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

    private isTileAvailable(tilePosition: Point): boolean {
        const rootEntity = this.context.root;
        const entitiesAt = rootEntity
            .requireComponent(ChunkMapComponent)
            .getEntityAt(tilePosition);

        const tile = rootEntity
            .requireComponent(TilesComponent)
            .getTile(tilePosition);

        return entitiesAt.length == 0 && !!tile;
    }
}

type SelectedTile = {
    isAvailable: boolean;
    x: number;
    y: number;
};
