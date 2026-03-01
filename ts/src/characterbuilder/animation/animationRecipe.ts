export type {
    PartFrame,
    AnimationPart,
    AnchorFrame,
    AnimationAnchor,
    CharacterAnimation,
} from "../characterAnimation.ts";

/**
 * Base sourced from a single frame of a named hand-painted animation.
 */
export type RecipeBaseFrame = {
    type: "frame";
    sourceAnimation: string;
    sourceFrame: number;
};

/**
 * Base sourced from another recipe, inheriting its duration, tracks, anchor tracks,
 * and mirror toggles. New operations are layered on top.
 */
export type RecipeBaseRecipe = {
    type: "recipe";
    recipe: AnimationRecipe;
};

export type RecipeBase = RecipeBaseFrame | RecipeBaseRecipe;

export type TrackOperation =
    | { type: "hide"; start: number; end: number }
    | { type: "show"; start: number; end: number }
    | { type: "offset"; start: number; end: number; x: number; y: number }
    | {
          type: "replace";
          start: number;
          end: number;
          source: { sourceAnimation: string; sourceFrame: number };
      };

export type AnchorTrackOperation =
    | { type: "offset"; start: number; end: number; x: number; y: number }
    | { type: "hide"; start: number; end: number };

/**
 * A fully serializable description of a code-defined animation.
 * Produced by the builder, consumed by the compiler.
 */
export interface AnimationRecipe {
    name: string;
    base: RecipeBase;
    duration: number;
    /**
     * Frame numbers at which the mirror state toggles (XOR semantics).
     * The compiler starts in an unmirrored state and flips at each listed frame.
     * Multiple toggles at the same frame cancel out.
     */
    mirrorToggles: number[];
    tracks: Record<string, TrackOperation[]>;
    anchorTracks: Record<string, AnchorTrackOperation[]>;
}
