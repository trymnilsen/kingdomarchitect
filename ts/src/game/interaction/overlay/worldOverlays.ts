import type { RenderScope } from "../../../rendering/renderScope.ts";
import type { Entity } from "../../entity/entity.ts";
import { drawHearthlightOverlay } from "./hearthlightOverlay.ts";

export type WorldOverlayId = "hearthlight";

// Keyed by every id so a new overlay without a drawer fails to compile.
const overlayRenderers: Record<
    WorldOverlayId,
    (root: Entity, renderScope: RenderScope) => void
> = {
    hearthlight: drawHearthlightOverlay,
};

/**
 * Which world overlays the player has switched on. Presentation state owned
 * by the interaction layer; nothing here is a fact about the world.
 */
export class WorldOverlays {
    private enabled: Set<WorldOverlayId> = new Set();

    toggle(overlayId: WorldOverlayId): void {
        if (this.enabled.has(overlayId)) {
            this.enabled.delete(overlayId);
        } else {
            this.enabled.add(overlayId);
        }
    }

    draw(root: Entity, renderScope: RenderScope): void {
        for (const overlayId of this.enabled) {
            overlayRenderers[overlayId](root, renderScope);
        }
    }
}
