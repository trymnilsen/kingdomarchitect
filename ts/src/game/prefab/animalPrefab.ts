import { generateId } from "../../common/idGenerator.ts";
import type { Animal } from "../../data/animal/animal.ts";
import { loopAnimation } from "../../rendering/animation/animationGraph.ts";
import { createAnimalComponent } from "../component/animalComponent.ts";
import { createAnimationComponent } from "../component/animationComponent.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createLootComponent } from "../component/lootComponent.ts";
import {
    createSpriteComponent,
    UNIT_SPRITE_DEPTH,
} from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";

/**
 * A wild animal standing in the world. It can be hurt and killed like any
 * other creature, and dying hands its loot table to the loot system.
 *
 * It has no behavior agent, so it stays where it is put. Wandering and fleeing
 * come later.
 */
export function animalPrefab(animal: Animal): Entity {
    const entity = new Entity(generateId("animal"));
    entity.setEcsComponent(createAnimalComponent(animal.id));
    entity.setEcsComponent(
        createSpriteComponent(
            animal.sprite,
            undefined,
            undefined,
            undefined,
            UNIT_SPRITE_DEPTH,
        ),
    );
    entity.setEcsComponent(
        createAnimationComponent(loopAnimation(animal.sprite)),
    );
    entity.setEcsComponent(createHealthComponent(animal.health, animal.health));
    entity.setEcsComponent(createLootComponent(animal.loot.id));
    return entity;
}
