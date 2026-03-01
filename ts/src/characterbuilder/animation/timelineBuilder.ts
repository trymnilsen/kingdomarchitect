import type {
    AnchorTrackOperation,
    AnimationRecipe,
    RecipeBase,
    TrackOperation,
} from "./animationRecipe.ts";

/**
 * Known body part names for the character sprite system.
 * The builder accepts `string` for part names in recipes (for extensibility),
 * but this alias documents the currently valid set for use in authored animations.
 */
export type CharacterPartName =
    | "Head"
    | "Chest"
    | "Pants"
    | "LeftFoot"
    | "RightFoot"
    | "LeftHand"
    | "RightHand"
    | "LeftEye"
    | "RightEye";

export interface TrackBuilder {
    /** Move the cursor to frame t. Single-frame default: end = t + 1. */
    at(t: number): TrackBuilder;
    /** Extend the current operation span to frame t (exclusive). */
    until(t: number): TrackBuilder;
    /** Hide this part (empty pixel data) for the current span. */
    hide(): TrackBuilder;
    /** Explicitly restore the base frame pixels for the current span. */
    show(): TrackBuilder;
    /** Shift all pixels by (x, y) for the current span. */
    offset(x: number, y: number): TrackBuilder;
    /** Replace pixels with the matching part's data from a different source frame. */
    replaceWith(animationName: string, frame: number): TrackBuilder;
    /**
     * At build() time, copies all operations registered for the named part
     * into this track. The source part must be configured before build() is called.
     */
    copyFrom(partName: string): TrackBuilder;
}

export interface AnchorTrackBuilder {
    at(t: number): AnchorTrackBuilder;
    until(t: number): AnchorTrackBuilder;
    offset(x: number, y: number): AnchorTrackBuilder;
    hide(): AnchorTrackBuilder;
}

export interface TimelineBuilder {
    /** Use a single frame from a named hand-painted animation as the base. */
    basedOn(animationName: string, frame: number): TimelineBuilder;
    /** Inherit everything (duration, tracks, anchors, mirror toggles) from an existing recipe. */
    basedOn(recipe: AnimationRecipe): TimelineBuilder;
    /** Set the total frame count. Required when based on a frame; optional when based on a recipe. */
    duration(frames: number): TimelineBuilder;
    /**
     * Set the cursor position for the next mirror() call.
     * If mirror() is called without a prior at(), it toggles at frame 0.
     */
    at(t: number): TimelineBuilder;
    /** Define operations on a specific body part's track. */
    part(partName: string, configure: (track: TrackBuilder) => void): TimelineBuilder;
    /** Define operations on a specific anchor's track. */
    anchor(
        anchorId: string,
        configure: (track: AnchorTrackBuilder) => void,
    ): TimelineBuilder;
    /**
     * Record a mirror-state toggle at the current cursor frame.
     * Multiple toggles at the same frame cancel out (XOR).
     */
    mirror(): TimelineBuilder;
    /** Compile the builder state into an AnimationRecipe. */
    build(): AnimationRecipe;
}

/**
 * Creates a new TimelineBuilder for the animation with the given name.
 */
export function timeline(name: string): TimelineBuilder {
    return new TimelineBuilderImpl(name);
}

class TrackBuilderImpl implements TrackBuilder {
    private cursor = 0;
    private end = 1;
    readonly ops: TrackOperation[] = [];
    copyFromPart: string | null = null;

    at(t: number): TrackBuilder {
        this.cursor = t;
        this.end = t + 1;
        return this;
    }

    until(t: number): TrackBuilder {
        this.end = t;
        return this;
    }

    hide(): TrackBuilder {
        this.ops.push({ type: "hide", start: this.cursor, end: this.end });
        this.end = this.cursor + 1;
        return this;
    }

    show(): TrackBuilder {
        this.ops.push({ type: "show", start: this.cursor, end: this.end });
        this.end = this.cursor + 1;
        return this;
    }

    offset(x: number, y: number): TrackBuilder {
        this.ops.push({ type: "offset", start: this.cursor, end: this.end, x, y });
        this.end = this.cursor + 1;
        return this;
    }

    replaceWith(animationName: string, frame: number): TrackBuilder {
        this.ops.push({
            type: "replace",
            start: this.cursor,
            end: this.end,
            source: { sourceAnimation: animationName, sourceFrame: frame },
        });
        this.end = this.cursor + 1;
        return this;
    }

    copyFrom(partName: string): TrackBuilder {
        this.copyFromPart = partName;
        return this;
    }
}

class AnchorTrackBuilderImpl implements AnchorTrackBuilder {
    private cursor = 0;
    private end = 1;
    readonly ops: AnchorTrackOperation[] = [];

    at(t: number): AnchorTrackBuilder {
        this.cursor = t;
        this.end = t + 1;
        return this;
    }

    until(t: number): AnchorTrackBuilder {
        this.end = t;
        return this;
    }

    offset(x: number, y: number): AnchorTrackBuilder {
        this.ops.push({ type: "offset", start: this.cursor, end: this.end, x, y });
        this.end = this.cursor + 1;
        return this;
    }

    hide(): AnchorTrackBuilder {
        this.ops.push({ type: "hide", start: this.cursor, end: this.end });
        this.end = this.cursor + 1;
        return this;
    }
}

class TimelineBuilderImpl implements TimelineBuilder {
    private name: string;
    private base: RecipeBase | null = null;
    private _duration: number | null = null;
    private mirrorCursor = 0;
    private mirrorToggles: number[] = [];
    private trackBuilders: Map<string, TrackBuilderImpl> = new Map();
    private anchorBuilders: Map<string, AnchorTrackBuilderImpl> = new Map();

    constructor(name: string) {
        this.name = name;
    }

    basedOn(animationNameOrRecipe: string | AnimationRecipe, frame?: number): TimelineBuilder {
        if (typeof animationNameOrRecipe === "string") {
            this.base = {
                type: "frame",
                sourceAnimation: animationNameOrRecipe,
                sourceFrame: frame ?? 0,
            };
        } else {
            const parentRecipe = animationNameOrRecipe;
            this.base = { type: "recipe", recipe: parentRecipe };
            if (this._duration === null) {
                this._duration = parentRecipe.duration;
            }
            this.mirrorToggles = [...parentRecipe.mirrorToggles];
            for (const [partName, ops] of Object.entries(parentRecipe.tracks)) {
                const builder = new TrackBuilderImpl();
                builder.ops.push(...ops);
                this.trackBuilders.set(partName, builder);
            }
            for (const [anchorId, ops] of Object.entries(parentRecipe.anchorTracks)) {
                const builder = new AnchorTrackBuilderImpl();
                builder.ops.push(...ops);
                this.anchorBuilders.set(anchorId, builder);
            }
        }
        return this;
    }

    duration(frames: number): TimelineBuilder {
        this._duration = frames;
        return this;
    }

    at(t: number): TimelineBuilder {
        this.mirrorCursor = t;
        return this;
    }

    part(partName: string, configure: (track: TrackBuilder) => void): TimelineBuilder {
        let builder = this.trackBuilders.get(partName);
        if (!builder) {
            builder = new TrackBuilderImpl();
            this.trackBuilders.set(partName, builder);
        }
        configure(builder);
        return this;
    }

    anchor(anchorId: string, configure: (track: AnchorTrackBuilder) => void): TimelineBuilder {
        let builder = this.anchorBuilders.get(anchorId);
        if (!builder) {
            builder = new AnchorTrackBuilderImpl();
            this.anchorBuilders.set(anchorId, builder);
        }
        configure(builder);
        return this;
    }

    mirror(): TimelineBuilder {
        this.mirrorToggles.push(this.mirrorCursor);
        this.mirrorCursor = 0;
        return this;
    }

    build(): AnimationRecipe {
        if (this.base === null) {
            throw new Error(
                `Timeline "${this.name}": basedOn() must be called before build()`,
            );
        }

        const duration = this._duration;
        if (duration === null) {
            throw new Error(
                `Timeline "${this.name}": duration() must be called before build() when based on a frame`,
            );
        }

        const tracks: Record<string, TrackOperation[]> = {};
        for (const [partName, builder] of this.trackBuilders) {
            if (builder.copyFromPart !== null) {
                const sourceBuilder = this.trackBuilders.get(builder.copyFromPart);
                if (!sourceBuilder) {
                    throw new Error(
                        `Timeline "${this.name}": copyFrom("${builder.copyFromPart}") references a part that was not configured`,
                    );
                }
                tracks[partName] = [...sourceBuilder.ops];
            } else {
                tracks[partName] = [...builder.ops];
            }
        }

        const anchorTracks: Record<string, AnchorTrackOperation[]> = {};
        for (const [anchorId, builder] of this.anchorBuilders) {
            anchorTracks[anchorId] = [...builder.ops];
        }

        return {
            name: this.name,
            base: this.base,
            duration,
            mirrorToggles: [...this.mirrorToggles],
            tracks,
            anchorTracks,
        };
    }
}
