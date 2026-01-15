/**
 * Component that tracks energy/stamina for entities.
 * Energy ranges from 0 (exhausted) to 100 (fully rested).
 */
export type EnergyComponent = {
    id: typeof EnergyComponentId;

    /** Current energy level (0-100) */
    energy: number;

    /** Rate at which energy decreases per tick */
    energyRate: number;

    /** Rate at which energy restores per tick when sleeping */
    restoreRate: number;
};

export const EnergyComponentId = "Energy";

/**
 * Create a new energy component with default values.
 */
export function createEnergyComponent(
    initialEnergy: number = 100,
    energyRate: number = 0.5,
    restoreRate: number = 20,
): EnergyComponent {
    return {
        id: EnergyComponentId,
        energy: initialEnergy,
        energyRate,
        restoreRate,
    };
}

/**
 * Increase energy by the specified amount.
 * Energy is clamped to a maximum of 100.
 */
export function increaseEnergy(
    component: EnergyComponent,
    amount: number,
): void {
    component.energy = Math.min(100, component.energy + amount);
}

/**
 * Decrease energy by the specified amount.
 * Energy is clamped to a minimum of 0.
 */
export function decreaseEnergy(
    component: EnergyComponent,
    amount: number,
): void {
    component.energy = Math.max(0, component.energy - amount);
}
