import { sprites2 } from "../../../../asset/sprite.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Building } from "../../../../data/building/building.js";
import { woodResourceItem } from "../../../../data/inventory/resources.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { InventoryComponent } from "../../../component/inventory/inventoryComponent.js";
import { TilesComponent } from "../../../component/tile/tilesComponent.js";
import { BuildJob } from "../../../world/job/jobs/buildJob.js";
import { buildingFactory } from "../../../world/prefab/buildingFactory.js";
import { buildingPrefab } from "../../../world/prefab/buildingPrefab.js";
import { GroundTile } from "../../../world/tile/ground.js";
import { TileSize } from "../../../world/tile/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { BuildMode } from "./mode/buildMode.js";
import { LineBuildMode } from "./mode/lineBuildMode.js";
import { SingleBuildMode } from "./mode/singleBuildMode.js";

export class BuildConfirmState extends InteractionState {
    private scaffold: UIActionbarScaffold | null = null;
    private blinkScaffold: boolean = true;
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
                onClick: () => {
                    if (this.scaffold?.isExpanded) {
                        this.scaffold.resetExpandedMenu();
                    } else {
                        this.onBuildModeSelected();
                    }
                },
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
            },*/
            ],
            1
        );
    }

    private confirmBuildSelection() {
        const rootEntity = this.context.world.rootEntity;
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
                new AlertMessageState("Oh no", "Spot taken")
            );
            return;
        }

        const removeResult = inventoryComponent.removeInventoryItem(
            woodResourceItem.id,
            10 * selections.length
        );

        if (removeResult) {
            for (const selection of selections) {
                const house = buildingFactory(this.building);
                house.position = selection;
                this.context.world.rootEntity.addChild(house);
                this.context.world.jobQueue.addJob(new BuildJob(house));
            }

            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "Not enough resources")
            );
        }
    }

    private changeBuildMode(mode: BuildMode) {
        this.buildMode = mode;
        this.scaffold?.resetExpandedMenu();
        this.scaffold?.setLeftMenu(this.getActionItems());
    }

    private cancel() {
        this.context.stateChanger.clear();
    }

    override onTap(screenPosition: Point, worldPosition: Point): boolean {
        const isTileAtPosition =
            this.context.world.ground.getTile(worldPosition);

        if (this.scaffold?.isExpanded && isTileAtPosition) {
            this.scaffold.resetExpandedMenu();
            return true;
        } else {
            return false;
        }
    }

    override onTileTap(tile: GroundTile): boolean {
        if (this.scaffold?.isExpanded) {
            this.scaffold.resetExpandedMenu();
        }

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

    override onUpdate(tick: number): void {
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
        const rootEntity = this.context.world.rootEntity;
        const entitiesAt = rootEntity.getEntityAt(tilePosition);
        const tile = rootEntity
            .getComponent(TilesComponent)
            ?.getTile(tilePosition);
        const hasTree = tile?.hasTree;

        return entitiesAt.length == 0 && !!tile && !hasTree;
    }
}

interface SelectedTile {
    isAvailable: boolean;
    x: number;
    y: number;
}
