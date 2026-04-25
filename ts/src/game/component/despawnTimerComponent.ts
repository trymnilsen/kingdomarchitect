export type DespawnTimerComponent = {
    id: typeof DespawnTimerComponentId;
    spawnTime: number;
    duration: number;
};

export const DespawnTimerComponentId = "despawnTimer";

export function createDespawnTimerComponent(
    spawnTime: number,
    duration: number,
): DespawnTimerComponent {
    return {
        id: DespawnTimerComponentId,
        spawnTime,
        duration,
    };
}
