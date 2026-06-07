import type { Point } from "../../common/point.ts";
import { offsetPatternWithPoint } from "../../common/pattern.ts";
import type { Entity } from "../entity/entity.ts";
import { MessageEmitterComponentId } from "../component/messageEmitterComponent.ts";
import { WorldDiscoveryComponentId } from "../component/worldDiscoveryComponent.ts";
import { setDiscoveryForPlayer } from "../system/worldGenerationSystem.ts";
import { revealFootprintOffsets } from "../vision/revealFootprint.ts";

/**
 * Stamps fog-of-war discovery for everything `entity` reveals, placed at `center`.
 * The player permanently remembers the entity's reveal footprint — its vision
 * reach and, for a light source, the tiles it illuminates — so a lit area becomes
 * map memory instead of reverting to undiscovered black once the light or the
 * viewer is gone.
 *
 * `center` is passed separately from the entity's own position because callers
 * stamp at different points: a moving worker discovers around the tile it steps
 * onto (before its transform updates), while a finished building discovers around
 * its own world position.
 *
 * @param root the world root, holding the discovery component and message emitter
 * @param entity the viewer or emitter whose reveal is discovered
 * @param center the world tile the footprint is centred on
 */
export function discoverFootprint(root: Entity, entity: Entity, center: Point) {
    // Discovery only exists in a world that tracks it. A root without the
    // discovery state and message emitter — a headless or partial root, as focused
    // tests build — has nothing to stamp, so there is nothing to do.
    const messageEmitter = root.getEcsComponent(MessageEmitterComponentId);
    const tracksDiscovery = !!root.getEcsComponent(WorldDiscoveryComponentId);
    if (!messageEmitter || !tracksDiscovery) {
        return;
    }

    const points = offsetPatternWithPoint(center, revealFootprintOffsets(entity));
    setDiscoveryForPlayer(root, messageEmitter.emitter, "player", points);
}
