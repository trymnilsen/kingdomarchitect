import type { Volume } from "../../../game/map/volume.ts";
import { TileComponentId } from "../../../game/component/tileComponent.ts";
import { WorldDiscoveryComponentId } from "../../../game/component/worldDiscoveryComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";
import {
    getPlayerDiscoveryData,
    type DiscoveredTileData,
} from "../playerDiscoveryData.ts";

export type DiscoverTileEffect = {
    id: typeof DiscoverTileEffectId;
    tiles: DiscoveredTileData[];
    volumes?: Volume[];
};

export const DiscoverTileEffectId = "discoverTile";

/**
 * Builds a discovery effect containing all tiles discovered by a player.
 * Reads from WorldDiscoveryComponent to determine which tiles to include.
 *
 * @param root The root entity containing tile and discovery components
 * @param player The player ID to get discovered tiles for
 * @returns Complete discovery effect, or null if nothing discovered
 */
export function buildDiscoveryEffectForPlayer(
    root: Entity,
    player: string,
): DiscoverTileEffect | null {
    const tileComponent = root.getEcsComponent(TileComponentId);
    const discoveryComponent = root.getEcsComponent(WorldDiscoveryComponentId);

    if (!tileComponent || !discoveryComponent) {
        return null;
    }

    const playerDiscovery = discoveryComponent.discoveriesByUser.get(player);
    if (!playerDiscovery) {
        return null;
    }

    const data = getPlayerDiscoveryData(tileComponent, playerDiscovery);
    if (!data) {
        return null;
    }

    return {
        id: DiscoverTileEffectId,
        tiles: data.tiles,
        volumes: data.volumes,
    };
}
