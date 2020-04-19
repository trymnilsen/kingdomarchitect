import { Direction } from "../../data/direction";
import { Point } from "../../data/point";
import { Camera } from "../rendering/camera";
import { rectangle } from "../rendering/items/rectangle";
import { container, RenderNode } from "../rendering/items/renderNode";
import {
    CAMPFIRE_TILE_ITEM_TYPE,
    GameState,
    STONE_TILE_ITEM_TYPE,
    TileMap,
    TREE_TILE_ITEM_TYPE,
} from "../state/gameState";
import { campfireVisual } from "../visual/campfire";
import { playerVisual } from "../visual/player";
import { stoneVisual } from "../visual/stone";
import { treeVisual } from "../visual/tree";
import { GameScene } from "./gameScene";
import { getUi } from "../ui/uiPresenter";

export class MainScene implements GameScene {
    onRender(gameState: GameState, camera: Camera): RenderNode {
        const world = container();
        world.children.push(this.renderTiles(gameState.tiles));
        world.children.push(
            this.renderPlayer(
                gameState.playerState.position,
                gameState.playerState.direction
            )
        );
        return world;
    }

    private renderPlayer(
        playerPosition: Point,
        direction: Direction
    ): RenderNode {
        const visual = playerVisual(direction);
        visual.config.x = playerPosition.x * 32;
        visual.config.y = playerPosition.y * 32;
        return visual;
    }

    private renderTiles(tiles: TileMap): RenderNode {
        const allTiles = container();
        for (const tileKey in tiles) {
            if (tiles.hasOwnProperty(tileKey)) {
                const tile = tiles[tileKey];
                const tileContainer = container({
                    x: tile.x * 32,
                    y: tile.y * 32,
                });
                const tileVisual = rectangle({
                    x: 2,
                    y: 2,
                    width: 28,
                    height: 28,
                    fill: "#32a852",
                });
                tileContainer.children.push(tileVisual);
                tile.items.forEach((item) => {
                    const visual = getTileItemVisual(item.type);
                    if (!!visual) {
                        tileContainer.children.push(visual);
                    }
                });
                allTiles.children.push(tileContainer);
            }
        }
        return allTiles;
    }
}

function getTileItemVisual(type: String) {
    switch (type) {
        case TREE_TILE_ITEM_TYPE:
            return treeVisual();
        case STONE_TILE_ITEM_TYPE:
            return stoneVisual();
        case CAMPFIRE_TILE_ITEM_TYPE:
            return campfireVisual();
    }
    return null;
}
