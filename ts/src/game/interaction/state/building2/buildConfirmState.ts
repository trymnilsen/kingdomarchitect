import { findMapped } from "../../../../common/array.js";
import { Point } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Building } from "../../../../data/building/building.js";
import { sprites2 } from "../../../../module/asset/sprite.js";
import { GroundTile, TileSize } from "../../../../module/map/tile.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../module/ui/uiSize.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { makeBuildBuildingAction } from "../../../action/world/buildingAction.js";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../component/chunkMapComponent.js";
import { getTile, TileComponentId } from "../../../component/tileComponent.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { BuildingApplicabilityResult } from "./buildingApplicability.js";
import { buildingApplicabilityList } from "./buildingApplicabilityList.js";
import { BuildMode } from "./mode/buildMode.js";
import { LineBuildMode } from "./mode/lineBuildMode.js";
import { SingleBuildMode } from "./mode/singleBuildMode.js";

export class BuildConfirmState extends InteractionState {
    private scaffold: UIActionbarScaffold | null = null;
    private blinkScaffold = true;
    private buildMode: BuildMode;
    private selection: SelectedTile[] = [];

    override get stateName(): string {
        return "Confirm build";
    }

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
        //this.view = scaffold;
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

        const selections = this.buildMode.getSelection();
        if (selections.length == 0) {
            this.context.stateChanger.push(
                new AlertMessageState("Oh no", "No selection"),
            );
            return;
        }

        const tileError = findMapped(selections, (value) => {
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

        if (removeResult) {
            for (const selection of selections) {
                this.context.root.dispatchAction(
                    makeBuildBuildingAction(this.building, selection),
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

    override onTap(_screenPosition: Point, _worldPosition: Point): boolean {
        /*
        const isTileAtPosition = this.context.root
            .requireComponent(TilesComponent)
            .getTile(worldPosition);
        */
        //TODO: this was not used before, is it needed?
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
        const chunkMap = rootEntity.requireEcsComponent(ChunkMapComponentId);
        const entitiesAt = getEntitiesAt(
            chunkMap,
            tilePosition.x,
            tilePosition.y,
        );

        if (entitiesAt.length > 0) {
            return {
                isApplicable: false,
                reason: "Spot taken",
            };
        }

        const tileComponent = rootEntity.requireEcsComponent(TileComponentId);
        const tile = getTile(tileComponent, tilePosition);

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
