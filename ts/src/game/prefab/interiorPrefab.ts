import { sprites2 } from "../../asset/sprite.js";
import { generateId } from "../../common/idGenerator.js";
import { createSpaceComponent } from "../component/spaceComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function interiorPrefab(id: string): Entity {
    const interiorEntity = new Entity(id);
    interiorEntity.setEcsComponent(createSpaceComponent());
    for (const point of floors) {
        const entity = new Entity(generateId("wall"));
        entity.worldPosition = point;
        entity.setEcsComponent(createSpriteComponent(sprites2.interior_floor));
        interiorEntity.addChild(entity);
    }

    for (const point of walls) {
        const entity = new Entity(generateId("wall"));
        entity.worldPosition = point;
        entity.setEcsComponent(
            createSpriteComponent(sprites2.interior_wood_wall_right_left),
        );
        interiorEntity.addChild(entity);
    }

    for (const point of stools) {
        const entity = new Entity(generateId("stool"));
        entity.worldPosition = point;
        entity.setEcsComponent(createSpriteComponent(sprites2.interior_stool));
        interiorEntity.addChild(entity);
    }

    const tableEntity = new Entity(generateId("table"));
    tableEntity.worldPosition = { x: 2, y: 2 };
    tableEntity.setEcsComponent(createSpriteComponent(sprites2.interior_table));
    interiorEntity.addChild(tableEntity);

    const doorEntity = new Entity(generateId("door"));
    doorEntity.worldPosition = { x: 1, y: 5 };
    doorEntity.setEcsComponent(createSpriteComponent(sprites2.interior_door));
    interiorEntity.addChild(doorEntity);

    return interiorEntity;
}

const stools = [
    { x: 2, y: 1 },
    { x: 1, y: 2 },
    { x: 3, y: 2 },
];

const walls = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 1 },
    { x: 5, y: 1 },
    { x: 5, y: 2 },
    { x: 5, y: 3 },
    { x: 5, y: 4 },
    { x: 4, y: 4 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
    { x: 0, y: 5 },
    { x: 0, y: 4 },
    { x: 0, y: 3 },
    { x: 0, y: 2 },
    { x: 0, y: 1 },
];

const floors = [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 1, y: 5 },
];
