export const KingdomSpawnConfig = {
    /** Base probability that an eligible volume spawns a kingdom */
    baseProbability: 0.15,

    /** Minimum volume maxSize to be eligible for kingdom spawning */
    minimumVolumeSize: 4,

    /** Biome suitability weights — multiplied against base probability */
    biomeSuitability: {
        plains: 1.3,
        forrest: 0.9,
        snow: 0.5,
        mountains: 0.6,
        desert: 0.4,
        swamp: 0.25,
        taint: 0.0,
    } as const,

    /** Progression curve parameters */
    progression: {
        /** Minimum multiplier (at tick 0) */
        floor: 0.4,
        /** Maximum multiplier (late game) */
        ceiling: 1.2,
        /** Scaling divisor for the log curve — higher = slower ramp */
        scaleDivisor: 1000,
    } as const,

    /** Influence system parameters */
    influence: {
        /**
         * Starting influence strength per kingdom type, keyed by KingdomType value.
         * Player kingdoms project the strongest influence (discouraging NPC spawns
         * nearby), NPC kingdoms are moderate, and goblin camps are weak.
         */
        strength: {
            [0]: 25.0, // KingdomType.Player
            [1]: 10.0, // KingdomType.Npc
            [2]: 3.0,  // KingdomType.Goblin
        } as const,
        /** Fraction of influence lost per volume boundary crossing (0–1) */
        decayRate: 0.35,
        /** Influence values below this are discarded (stops flood fill) */
        cutoffThreshold: 0.1,
        /** Total influence at candidate above this means zero spawn chance */
        suppressionThreshold: 5.0,
    } as const,
} as const;
