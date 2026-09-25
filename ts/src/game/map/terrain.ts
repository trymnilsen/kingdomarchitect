export const Terrain = {
    Land: 0,
    Water: 1,
    Ice: 2,
} as const;

export type Terrain = (typeof Terrain)[keyof typeof Terrain];

export type TerrainColors = {
    color: string;
    tint: string;
};

export type TerrainDefinition = {
    name: string;
    pathWeight: number;
    buildable: boolean;
    defaultColors: TerrainColors | null;
};

export const terrainDefinitions: Record<Terrain, TerrainDefinition> = {
    [Terrain.Land]: {
        name: "Land",
        pathWeight: 2,
        buildable: true,
        defaultColors: null,
    },
    [Terrain.Water]: {
        name: "Water",
        pathWeight: 0,
        buildable: false,
        defaultColors: { color: "#3f78b5", tint: "#22405e" },
    },
    [Terrain.Ice]: {
        name: "Ice",
        pathWeight: 4,
        buildable: false,
        defaultColors: { color: "#cfe8f0", tint: "#8497a0" },
    },
};

export function isWalkableTerrain(terrain: Terrain): boolean {
    return terrainDefinitions[terrain].pathWeight > 0;
}

export function isBuildableTerrain(terrain: Terrain): boolean {
    return terrainDefinitions[terrain].buildable;
}
