export type WorldDiscoveryData = {
    readonly fullyDiscoveredChunks: Set<number>;
    readonly partiallyDiscoveredChunks: Map<number, Set<number>>;
};

export type WorldDiscoveryComponent = {
    id: typeof WorldDiscoveryComponentId;
    discoveriesByUser: Map<string, WorldDiscoveryData>;
};

export function createWorldDiscoveryComponent(): WorldDiscoveryComponent {
    return {
        id: WorldDiscoveryComponentId,
        discoveriesByUser: new Map(),
    };
}

export const WorldDiscoveryComponentId = "worldDiscovery";
