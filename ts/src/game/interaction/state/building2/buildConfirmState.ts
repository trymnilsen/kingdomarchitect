import { findMapped } from "../../../../common/array.ts";
import { Point } from "../../../../common/point.ts";
import { allSides } from "../../../../common/sides.ts";
import { Building } from "../../../../data/building/building.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { GroundTile, TileSize } from "../../../map/tile.ts";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { RenderScope } from "../../../../rendering/renderScope.ts";
import { getTile, TileComponentId } from "../../../component/tileComponent.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { AlertMessageState } from "../common/alertMessageState.ts";
import { BuildingApplicabilityResult } from "./buildingApplicability.ts";
import { buildingApplicabilityList } from "./buildingApplicabilityList.ts";
import { BuildMode } from "./mode/buildMode.ts";
import { LineBuildMode } from "./mode/lineBuildMode.ts";
import { SingleBuildMode } from "./mode/singleBuildMode.ts";
import { BuildCommand } from "../../../../server/message/command/buildCommand.ts";
import { queryEntity } from "../../../map/query/queryEntity.ts";

export class BuildConfirmState extends InteractionState {
    private blinkScaffold = true;
    private buildMode: BuildMode;
    private selection: SelectedTile[] = [];
    private building: Building;
    private cursorPosition: Point;

    override get stateName(): string {
        return "Confirm build";
    }

    constructor(building: Building, cursorPosition: Point) {
        super();
        this.building = building;
        this.cursorPosition = cursorPosition;
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
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    text: "Confirm",
                    onClick: () => {
                        this.confirmBuildSelection();
                    },
                },
                {
                    text: this.buildMode.description.name,
                    children: [
                        {
                            text: "Single",
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
                    onClick: () => {
                        this.cancel();
                    },
                },
            ],
        });
    }

    private confirmBuildSelection() {
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
            this.context.commandDispatcher(
                BuildCommand(this.building, selections),
            );
            this.context.stateChanger.clear();
        } else {
            this.context.stateChanger.push(
                new AlertMessageState("N/A", "TODO"),
            );
        }
    }

    private changeBuildMode(mode: BuildMode) {
        this.buildMode = mode;
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
                    ? spriteRefs.cursor
                    : spriteRefs.cursor_red,
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
        const entitiesAt = queryEntity(rootEntity, {
            x: tilePosition.x,
            y: tilePosition.y,
        });

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
