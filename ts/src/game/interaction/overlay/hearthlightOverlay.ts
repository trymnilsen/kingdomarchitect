import type { RenderScope } from "../../../rendering/renderScope.ts";
import type { Entity } from "../../entity/entity.ts";
import { computeHearthlight } from "../../light/hearthlight.ts";
import { drawTileSetOverlay } from "./drawTileSetOverlay.ts";

const fillColor = "rgba(255, 221, 0, 0.12)";
const boundaryColor = "rgba(255, 221, 0, 0.9)";

/**
 * A faint wash over every hearthlight tile and a solid line along the
 * boundary, which is where hostiles stop being targeted and defenders stop
 * pursuing. The lit set is rebuilt from the entity tree every frame; if that
 * ever shows in a profile, lightClaims.ts describes how to cache it.
 */
export function drawHearthlightOverlay(
    root: Entity,
    renderScope: RenderScope,
): void {
    drawTileSetOverlay(
        renderScope,
        computeHearthlight(root),
        fillColor,
        boundaryColor,
    );
}
