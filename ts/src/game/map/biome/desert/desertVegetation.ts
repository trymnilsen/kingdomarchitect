import { sprites2 } from "../../../../asset/sprite.js";
import { shuffleItems, weightedRandomEntry } from "../../../../common/array.js";
import { Bounds } from "../../../../common/bounds.js";
import { generateId } from "../../../../common/idGenerator.js";
import { Point, addPoint } from "../../../../common/point.js";
import { SpriteComponent } from "../../../component/draw/spriteComponent.js";
import { Entity } from "../../../entity/entity.js";
import { placeRandomEntity } from "../../tilesetPlacer.js";
import {
    BiomeMap,
    BiomeMapItem,
    BiomeMapItemEntityFactory,
} from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";

export function generateTumbleweed(map: BiomeMap) {
    const randomAmount = 16 + Math.floor(Math.random() * 32);
    placeRandomEntity(map, "tumbleweed", randomAmount, tumbleWeedFactory);
}

export function generateCactii(biomeMap: BiomeMap) {
    const points: Point[] = [];
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            const pointCandidate: Bounds = {
                x1: x,
                y1: y,
                x2: x + 1,
                y2: y + 1,
            };
            if (biomeMap.isSpotAvailable(pointCandidate)) {
                points.push({ x, y });
            }
        }
    }
    const shuffledPoints = shuffleItems(points);
    const numberOfCacti = Math.min(
        shuffledPoints.length - 1,
        32 + Math.floor(Math.random() * 100),
    );
    if (numberOfCacti > 0) {
        for (let i = 0; i < numberOfCacti; i++) {
            const point = shuffledPoints[i];
            biomeMap.setItem({
                name: "cacti",
                point: { x: point.x, y: point.y },
                size: { x: 1, y: 1 },
                factory: createEntityFactory(),
            });
        }
    }
}

function createEntityFactory(): BiomeMapItemEntityFactory {
    return (
        item: BiomeMapItem,
        biome: BiomeMap,
        _allMaps: BiomeMapCollection,
        rootEntity: Entity,
    ) => {
        const position = biome.worldPosition(item);
        const cactiEntity = new Entity(generateId("cacti"));
        cactiEntity.addComponent(
            new SpriteComponent(
                sprites2.cactus,
                { x: 2, y: 2 },
                { x: 32, y: 32 },
            ),
        );
        cactiEntity.worldPosition = position;
        rootEntity.addChild(cactiEntity);
    };
}

export function generateRandomBushes() {}

function tumbleWeedFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    rootEntity: Entity,
) {
    const position = biome.worldPosition(item);
    const tumbleweedEntity = new Entity(generateId("tumbleweed"));
    tumbleweedEntity.addComponent(
        new SpriteComponent(
            sprites2.tumbleweed_1,
            { x: 2, y: 2 },
            { x: 32, y: 32 },
        ),
    );
    tumbleweedEntity.worldPosition = position;
    rootEntity.addChild(tumbleweedEntity);
}
