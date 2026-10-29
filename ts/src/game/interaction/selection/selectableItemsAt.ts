import type { Point } from "../../../common/point.ts";
import { entitiesFrontToBack } from "../../component/spriteComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import type { GroundTile } from "../../map/tile.ts";
import { SelectedEntityItem } from "./selectedEntityItem.ts";
import { SelectedTileItem } from "./selectedTileItem.ts";
import type { SelectedWorldItem } from "./selectedWorldItem.ts";

/**
 * Everything a press on the tile can select, in the order repeated presses
 * cycle through: the entities in the order they are stacked on screen, top
 * first so the order matches what the player sees, then the ground itself.
 */
export function selectableItemsAt(
    root: Entity,
    position: Point,
    ground: GroundTile | null,
): SelectedWorldItem[] {
    const entities = entitiesFrontToBack(queryEntity(root, position));
    const items: SelectedWorldItem[] = entities.map(
        (entity) => new SelectedEntityItem(entity),
    );
    if (ground) {
        items.push(new SelectedTileItem(ground));
    }
    return items;
}
