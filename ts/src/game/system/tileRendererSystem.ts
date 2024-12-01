import { EcsRenderEvent } from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { TilesComponent } from "../component/tile/tilesComponent.js";
import {
    TileComponent,
    TileEntry,
} from "../ecsComponent/world/tileComponent.js";
import { biomes } from "../map/biome/biome.js";
import { TileSize } from "../map/tile.js";

export function createTileRenderSystem(): EcsSystem {
    return createSystem({
        tiles: TileComponent,
    })
        .onEvent(EcsRenderEvent, (query, event) => {
            if (query.tiles.size == 1) {
                const tileComponent = query.tiles.elementAt(0);
                renderTiles(
                    event.renderScope,
                    Object.values(tileComponent.tiles),
                );
            }
        })
        .build();
}

function renderTiles(scope: RenderScope, tiles: TileEntry[]) {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        scope.drawRectangle({
            x: tile.x * TileSize,
            y: tile.y * TileSize,
            width: TileSize - 2,
            height: TileSize - 2,
            fill: biomes[tile.type].color,
        });
    }
}
