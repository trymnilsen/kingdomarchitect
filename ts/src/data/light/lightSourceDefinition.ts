/**
 * What an emitter burns. `Charcoal` draws on stored fuel that haulers keep
 * topped up; `Wood` is a single charge of logs built into the source itself,
 * burned once and never refilled. A source that never runs down because its
 * structure feeds it has no fuel at all, and stores `null`.
 */
export const LightSourceFuel = {
    Charcoal: "charcoal",
    Wood: "wood",
} as const;

export type LightSourceFuel =
    (typeof LightSourceFuel)[keyof typeof LightSourceFuel];

/**
 * How hard a source is to put out. `Destroy` means it cannot be snuffed at
 * all and goes away only with its host, and is named for destruction rather
 * than dismantling because a light source need not be a building.
 */
export const LightSourceExtinguishDifficulty = {
    Easy: "easy",
    Hard: "hard",
    Destroy: "destroy",
} as const;

export type LightSourceExtinguishDifficulty =
    (typeof LightSourceExtinguishDifficulty)[keyof typeof LightSourceExtinguishDifficulty];

/**
 * How a source lights. Whether the lit tiles count as hearthlight is decided on the light component.
 */
export type LightSourceDefinition = {
    id: string;
    lightRadius: number;
    fuel: LightSourceFuel | null;
    extinguishDifficulty: LightSourceExtinguishDifficulty;
};

export const buildingGlowLightSource: LightSourceDefinition = {
    id: "buildingGlow",
    lightRadius: 1,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Destroy,
};

export const cressetLightSource: LightSourceDefinition = {
    id: "cresset",
    lightRadius: 2,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Easy,
};

export const torchLightSource: LightSourceDefinition = {
    id: "torch",
    lightRadius: 1,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Easy,
};

export const campfireLightSource: LightSourceDefinition = {
    id: "campfire",
    lightRadius: 3,
    fuel: LightSourceFuel.Charcoal,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Easy,
};

export const lampPostLightSource: LightSourceDefinition = {
    id: "lampPost",
    lightRadius: 4,
    fuel: LightSourceFuel.Charcoal,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Hard,
};

export const wayshrineLightSource: LightSourceDefinition = {
    id: "wayshrine",
    lightRadius: 1,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Destroy,
};

export const ironBrazierLightSource: LightSourceDefinition = {
    id: "ironBrazier",
    lightRadius: 5,
    fuel: LightSourceFuel.Charcoal,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Hard,
};

export const glowmossLanternLightSource: LightSourceDefinition = {
    id: "glowmossLantern",
    lightRadius: 2,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Destroy,
};

export const pyreLightSource: LightSourceDefinition = {
    id: "pyre",
    lightRadius: 6,
    fuel: LightSourceFuel.Wood,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Easy,
};

export const workerGlowLightSource: LightSourceDefinition = {
    id: "workerGlow",
    lightRadius: 0,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Destroy,
};

export const searchlightLightSource: LightSourceDefinition = {
    id: "searchlight",
    lightRadius: 0,
    fuel: null,
    extinguishDifficulty: LightSourceExtinguishDifficulty.Destroy,
};

const lightSourceDefinitions: readonly LightSourceDefinition[] = [
    buildingGlowLightSource,
    cressetLightSource,
    torchLightSource,
    campfireLightSource,
    lampPostLightSource,
    wayshrineLightSource,
    ironBrazierLightSource,
    glowmossLanternLightSource,
    pyreLightSource,
    workerGlowLightSource,
    searchlightLightSource,
];

export function getLightSourceDefinition(
    id: string,
): LightSourceDefinition | undefined {
    return lightSourceDefinitions.find((definition) => definition.id === id);
}
