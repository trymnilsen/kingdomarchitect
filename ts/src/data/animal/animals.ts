import { spriteRefs } from "../../asset/sprite.ts";
import type { BiomeType } from "../../game/map/biome.ts";
import {
    feathersItem,
    hideItem,
    rawMeatItem,
} from "../inventory/items/animalProducts.ts";
import type { Animal } from "./animal.ts";

/**
 * A fox is hunted for the pelt and nothing else. Nobody in the kingdom eats
 * one, so the drop list says only what a trapper would actually carry home.
 */
export const fox: Animal = {
    id: "fox",
    name: "Fox",
    sprite: spriteRefs.fox,
    biomes: ["forrest", "plains", "snow"],
    health: 4,
    loot: {
        id: "animal_fox",
        sourceName: "Hunted Fox",
        drops: [{ item: hideItem, amount: 1, chance: 0.8 }],
    },
};

export const goat: Animal = {
    id: "goat",
    name: "Goat",
    sprite: spriteRefs.goat,
    biomes: ["mountains", "plains"],
    health: 6,
    loot: {
        id: "animal_goat",
        sourceName: "Slaughtered Goat",
        drops: [
            { item: rawMeatItem, amount: 1 },
            { item: hideItem, amount: 1, chance: 0.5 },
        ],
    },
};

/**
 * Cats and dogs live where people do and are worth nothing dead. They carry an
 * empty table rather than no table so the spawner and the loot system treat
 * every animal the same way.
 */
export const cat: Animal = {
    id: "cat",
    name: "Cat",
    sprite: spriteRefs.cat,
    biomes: ["plains"],
    health: 3,
    loot: {
        id: "animal_cat",
        sourceName: "Slain Cat",
        drops: [],
    },
};

export const dog: Animal = {
    id: "dog",
    name: "Dog",
    sprite: spriteRefs.dog,
    biomes: ["plains", "forrest"],
    health: 6,
    loot: {
        id: "animal_dog",
        sourceName: "Slain Dog",
        drops: [],
    },
};

export const pig: Animal = {
    id: "pig",
    name: "Pig",
    sprite: spriteRefs.pig,
    biomes: ["plains"],
    health: 8,
    loot: {
        id: "animal_pig",
        sourceName: "Slaughtered Pig",
        drops: [
            { item: rawMeatItem, amount: 2 },
            { item: hideItem, amount: 1, chance: 0.5 },
        ],
    },
};

/**
 * The boar is the reason a hunter takes a spear into the swamp. It is the best
 * meat in the wild and the most likely to fight back.
 */
export const boar: Animal = {
    id: "boar",
    name: "Boar",
    sprite: spriteRefs.boar,
    biomes: ["forrest", "swamp"],
    health: 14,
    loot: {
        id: "animal_boar",
        sourceName: "Hunted Boar",
        drops: [
            { item: rawMeatItem, amount: 2 },
            { item: hideItem, amount: 1, chance: 0.6 },
        ],
    },
};

export const hare: Animal = {
    id: "hare",
    name: "Hare",
    sprite: spriteRefs.hare,
    biomes: ["plains", "forrest", "snow"],
    health: 2,
    loot: {
        id: "animal_hare",
        sourceName: "Hunted Hare",
        drops: [
            { item: rawMeatItem, amount: 1 },
            { item: hideItem, amount: 1, chance: 0.3 },
        ],
    },
};

export const camel: Animal = {
    id: "camel",
    name: "Camel",
    sprite: spriteRefs.camel,
    biomes: ["desert"],
    health: 16,
    loot: {
        id: "animal_camel",
        sourceName: "Slaughtered Camel",
        drops: [
            { item: rawMeatItem, amount: 2 },
            { item: hideItem, amount: 1, chance: 0.75 },
        ],
    },
};

export const owl: Animal = {
    id: "owl",
    name: "Owl",
    sprite: spriteRefs.owl,
    biomes: ["forrest", "snow", "mountains"],
    health: 3,
    loot: {
        id: "animal_owl",
        sourceName: "Hunted Owl",
        drops: [{ item: feathersItem, amount: 1, chance: 0.5 }],
    },
};

export const hawk: Animal = {
    id: "hawk",
    name: "Hawk",
    sprite: spriteRefs.hawk,
    biomes: ["mountains", "desert", "plains"],
    health: 4,
    loot: {
        id: "animal_hawk",
        sourceName: "Hunted Hawk",
        drops: [{ item: feathersItem, amount: 1, chance: 0.6 }],
    },
};

export const chicken: Animal = {
    id: "chicken",
    name: "Chicken",
    sprite: spriteRefs.chicken,
    biomes: ["plains"],
    health: 2,
    loot: {
        id: "animal_chicken",
        sourceName: "Slaughtered Chicken",
        drops: [
            { item: rawMeatItem, amount: 1 },
            { item: feathersItem, amount: 2 },
        ],
    },
};

export const animals: readonly Animal[] = [
    fox,
    goat,
    cat,
    dog,
    pig,
    boar,
    hare,
    camel,
    owl,
    hawk,
    chicken,
] as const;

/**
 * The animals that can show up in a given biome. Returns an empty list for a
 * biome nothing lives in, which the caller should read as "leave this volume
 * empty" rather than falling back to a default animal.
 */
export function animalsForBiome(biome: BiomeType): Animal[] {
    return animals.filter((animal) => animal.biomes.includes(biome));
}

/**
 * The definition behind a spawned animal. Entities store the id, so everything
 * that wants the name, the sprite or the loot comes back through here rather
 * than copying the definition onto the entity.
 */
export function getAnimal(animalId: string): Animal | undefined {
    return animals.find((animal) => animal.id === animalId);
}
