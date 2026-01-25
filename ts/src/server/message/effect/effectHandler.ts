import { TileComponentId } from "../../../game/component/tileComponent.ts";
import { VisibilityMapComponentId } from "../../../game/component/visibilityMapComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";
import type { Camera } from "../../../rendering/camera.ts";
import { applyDiscoveredTiles } from "../applyDiscoveredTiles.ts";
import type { EffectGameMessage } from "../gameMessage.ts";
import {
    DiscoverTileEffectId,
    type DiscoverTileEffect,
} from "./discoverTileEffect.ts";
import { ReloadGameEffectId } from "./reloadGameEffect.ts";

export function effectHandler(
    root: Entity,
    _camera: Camera,
    message: EffectGameMessage,
) {
    switch (message.effect.id) {
        case DiscoverTileEffectId:
            discoverTileEffect(root, message.effect);
            break;
        case ReloadGameEffectId:
            window.location.reload();
            break;
        default:
            break;
    }
}

function discoverTileEffect(root: Entity, effect: DiscoverTileEffect) {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const visibilityMapComponent = root.requireEcsComponent(
        VisibilityMapComponentId,
    );

    applyDiscoveredTiles(
        tileComponent,
        visibilityMapComponent,
        effect.tiles,
        effect.volumes ?? [],
    );
}
