import { Sprite2, sprites2 } from "../../../../asset/sprite.js";
import { generateId } from "../../../../common/idGenerator.js";
import { EcsWorldScope } from "../../../../ecs/ecsWorldScope.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { StoneComponent } from "../../../component/resource/stoneComponent.js";
import { StaticSelectionInfoProvider } from "../../../component/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../../../component/selection/selectionInfoComponent.js";
import { Entity } from "../../../entity/entity.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateRandomStones(
    map: BiomeMap,
    minAmount: number = 64,
    randomMultiplier: number = 200,
) {
    const randomAmount =
        minAmount + Math.floor(Math.random() * randomMultiplier);
    placeRandomEntity(map, "stone", randomAmount, stoneFactory);
}

export function generateRandomBushes() {}

function stoneFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    _world: EcsWorldScope,
) {
    throw new Error("No reimplemented");
    const position = biome.worldPosition(item);
    const cactiEntity = new Entity(generateId("stone"));
    const sprite = getStoneSprite(biome);
    cactiEntity.addComponent(
        new SpriteComponent(sprite, { x: 2, y: 2 }, { x: 32, y: 32 }),
    );
    cactiEntity.addComponent(
        new SelectionInfoComponent(
            new StaticSelectionInfoProvider(
                sprites2.stone,
                "Stone",
                "Resource",
            ),
        ),
    );
    cactiEntity.addComponent(new StoneComponent());
    cactiEntity.addComponent(new WeightComponent(50));
    cactiEntity.worldPosition = position;
    //rootEntity.addChild(cactiEntity);
}

function getStoneSprite(biome: BiomeMap): Sprite2 {
    const variant = Math.floor(Math.random() * 3);
    if (biome.type == "snow") {
        switch (variant) {
            case 0:
                return sprites2.winter_stone;
            case 1:
                return sprites2.winter_stone2;
            default:
                return sprites2.winter_stone3;
        }
    } else if (biome.type == "plains") {
        switch (variant) {
            case 0:
                return sprites2.plains_stone;
            case 1:
                return sprites2.plains_stone2;
            default:
                return sprites2.plains_stone3;
        }
    } else {
        switch (variant) {
            case 0:
                return sprites2.stone;
            case 1:
                return sprites2.stone2;
            default:
                return sprites2.stone3;
        }
    }
}
