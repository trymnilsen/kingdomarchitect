import { Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { World } from "../world";
import { Entity } from "./entity";
import { getTileId } from "./tile";

export class Entities {
    private world: World;
    private tiles: { [id: string]: Entity } = {};

    constructor(world: World) {
        this.world = world;
    }

    getTile(position: Point): Entity {
        return this.tiles[getTileId(position.x, position.y)];
    }

    add(entity: Entity) {
        const tileId = getTileId(entity.tilePosition.x, entity.tilePosition.y);
        this.tiles[tileId] = entity;
        entity.world = this.world;
    }

    onDraw(renderContext: RenderContext) {
        for (const tile of Object.values(this.tiles)) {
            tile.onDraw(renderContext);
        }
    }
}
