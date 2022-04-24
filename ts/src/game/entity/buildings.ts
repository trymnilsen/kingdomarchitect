import { sprites } from "../../asset/sprite";
import { RenderContext } from "../../rendering/renderContext";
import { getTileId, TileSize } from "./tile";

export class Buildings {
    private tiles: { [id: string]: BuildingTile } = {};
    getTile(tileId: string): BuildingTile {
        return this.tiles[tileId];
    }
    add(building: BuildingTile) {
        const tileId = getTileId(building.x, building.y);
        this.tiles[tileId] = building;
    }
    onDraw(renderContext: RenderContext) {
        for (const tile of Object.values(this.tiles)) {
            renderContext.drawSprite({
                x: tile.x * TileSize + 2,
                y: tile.y * TileSize + 2,
                sprite: sprites[tile.sprite],
            });
        }
    }
}

export interface BuildingTile {
    x: number;
    y: number;
    sprite: keyof typeof sprites;
}
