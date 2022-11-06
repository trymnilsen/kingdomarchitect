import { RenderContext } from "../../rendering/renderContext";
import { Entity } from "./entity";
import { getTileId } from "./tile";

export class Entities {
    private tiles: { [id: string]: Entity } = {};
    getTile(tileX: number, tileY: number): Entity {
        return this.tiles[getTileId(tileX, tileY)];
    }

    add(entity: Entity) {
        const tileId = getTileId(entity.tilePosition.x, entity.tilePosition.y);
        this.tiles[tileId] = entity;
    }

    onDraw(renderContext: RenderContext) {
        for (const tile of Object.values(this.tiles)) {
            tile.onDraw(renderContext);
        }
    }
}
