export type AnimalComponent = {
    id: typeof AnimalComponentId;
    /** Id of the Animal definition this entity was spawned from. */
    animalId: string;
};

export const AnimalComponentId = "Animal";

export function createAnimalComponent(animalId: string): AnimalComponent {
    return {
        id: AnimalComponentId,
        animalId,
    };
}
