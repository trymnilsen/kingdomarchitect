import { spriteDefinitions } from "../../generated/sprites.ts";
import type { SpriteDefinition, SpriteRef } from "./sprite.ts";

/**
 * Registry for resolving sprite references to sprite definitions.
 * Handles both static sprites (from generated sprite sheets) and
 * dynamic sprites (generated at runtime, like character animations).
 */
export class SpriteRegistry {
    private dynamicSprites: Map<string, SpriteDefinition> = new Map();

    /**
     * Register a dynamically generated sprite definition.
     * Used by character generator and other runtime sprite creators.
     */
    registerSprite(ref: SpriteRef, definition: SpriteDefinition): void {
        const key = this.makeKey(ref);
        this.dynamicSprites.set(key, definition);
    }

    /**
     * Check if a dynamic sprite is registered.
     */
    hasSprite(ref: SpriteRef): boolean {
        const key = this.makeKey(ref);
        return this.dynamicSprites.has(key);
    }

    /**
     * Resolve a SpriteRef to a SpriteDefinition.
     * First checks dynamic sprites, then falls back to static sprites.
     * Returns undefined if the sprite is not found.
     */
    resolve(ref: SpriteRef): SpriteDefinition | undefined {
        const key = this.makeKey(ref);

        // Check dynamic sprites first
        const dynamic = this.dynamicSprites.get(key);
        if (dynamic) {
            return dynamic;
        }

        // Look up static sprite definition
        const def = spriteDefinitions[ref.spriteId];
        if (!def) {
            return undefined;
        }

        return def as SpriteDefinition;
    }

    /**
     * Clear all dynamic sprites for a specific bin.
     * Useful when regenerating character sprites.
     */
    clearBin(binId: string): void {
        for (const [key] of this.dynamicSprites) {
            if (key.startsWith(binId + ":")) {
                this.dynamicSprites.delete(key);
            }
        }
    }

    private makeKey(ref: SpriteRef): string {
        return `${ref.bin}:${ref.spriteId}`;
    }
}

/**
 * Global sprite registry instance.
 * This is used by the render system to resolve sprite references.
 */
export const spriteRegistry = new SpriteRegistry();
