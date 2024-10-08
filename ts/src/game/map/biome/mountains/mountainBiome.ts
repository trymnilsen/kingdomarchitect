import { randomEntry, removeItem } from "../../../../common/array.js";
import {
    Bounds,
    boundsCenter,
    boundsOverlap,
    getAllPositionsBoundsFitWithinBounds,
    pointWithinBounds,
    randomPointInBounds,
    sizeOfBounds,
} from "../../../../common/bounds.js";
import { Axis, Direction, getAxis } from "../../../../common/direction.js";
import { generateId } from "../../../../common/idGenerator.js";
import {
    Point,
    addPoint,
    floorPoint,
    manhattanDistance,
    manhattanPath,
    zeroPoint,
} from "../../../../common/point.js";
import { FixedGraph } from "../../../../path/graph/fixedGraph.js";
import { PathSearch } from "../../../../path/search.js";
import { WeightComponent } from "../../../component/movement/weightComponent.js";
import { MountainComponent } from "../../../component/world/mountainComponent.js";
import { Entity } from "../../../entity/entity.js";
import { BiomeEntry } from "../biome.js";
import { BiomeMap, BiomeMapItem } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateMines } from "../common/mine.js";
import { generateRandomStones } from "../common/stone.js";
import { generateRandomTrees } from "../common/vegetation.js";
import { generatePineTrees } from "./mountainVegetation.js";

export function createMountainsBiome(
    biome: BiomeEntry,
    biomes: BiomeMapCollection,
) {
    const biomeMap = biomes.getBiomeMap(biome);
    const mountainMap: MountainMap = {
        bounds: [],
    };

    generateForts(biomeMap);
    addCarveouts(mountainMap, biomeMap);
    generateConnectionPoints(biomeMap, biomes);
    connectCarveouts(mountainMap, biomeMap);
    blobbifyMountains();
    createStoneFromMountainMap(mountainMap, biomeMap);
    generatePineTrees(biomeMap, 32, 32);
    generateRandomStones(biomeMap, 8, 32);
    generateMines();
    return biomeMap;
}

interface MountainMap {
    bounds: Bounds[];
}

function addCarveouts(mountainMap: MountainMap, biomeMap: BiomeMap) {
    //Add items in biome to bounds
    for (const biomeItem of biomeMap.items) {
        mountainMap.bounds.push({
            x1: biomeItem.point.x,
            y1: biomeItem.point.y,
            x2: biomeItem.point.x + biomeItem.size.x,
            y2: biomeItem.point.y + biomeItem.size.y,
        });
    }
    //generate carveouts
    const maxBudget = (32 * 32) / 4;
    const maxSingleSize = Math.sqrt(maxBudget / 4);
    const minWidth = 2;
    const minHeight = 2;
    let attempts = 100;
    let usedBudget = 0;
    while (usedBudget < maxBudget && attempts > 0) {
        attempts -= 1;

        const sizeMultiplier = Math.min(
            Math.sqrt(maxBudget - usedBudget),
            maxSingleSize,
        );
        const width = minWidth + Math.floor(Math.random() * sizeMultiplier) + 3;
        const height =
            minHeight + Math.floor(Math.random() * sizeMultiplier) + 3;
        const possibleBounds = getAllPositionsBoundsFitWithinBounds(
            {
                x: 32,
                y: 32,
            },
            { x: width, y: height },
            (candidate) => {
                return !mountainMap.bounds.some((bound) =>
                    boundsOverlap(bound, candidate),
                );
            },
        );
        if (possibleBounds.length > 0) {
            const randomBoundsEntry = randomEntry(possibleBounds);
            const boundsSize = sizeOfBounds(randomBoundsEntry);
            usedBudget += boundsSize.x + boundsSize.y;
            mountainMap.bounds.push({
                x1: randomBoundsEntry.x1 + 2,
                y1: randomBoundsEntry.y1 + 2,
                x2: randomBoundsEntry.x2 - 2,
                y2: randomBoundsEntry.y2 - 2,
            });
        }
    }
}

function connectCarveouts(mountainMap: MountainMap, biomeMap: BiomeMap) {
    //for each bound, pick another bound and pathfind
    //set path as low weight
    //remove from list of non connected bounds
    //repeat until list of non connected is set
    //loop over connection points and add pathfind to bounds
    //We need a copy of the original carveouts
    const originalBounds = [...mountainMap.bounds];
    //Make a copy to pick bounds to path from
    const bounds = [...mountainMap.bounds];
    while (bounds.length > 0) {
        const bound = bounds.pop();
        if (!bound) {
            break;
        }

        const boundPoint = randomPointInBounds(bound);

        const otherBounds = originalBounds.filter(
            (originalBound) => originalBound != bound,
        );

        if (otherBounds.length == 0) {
            break;
        }

        const closestOtherBound = otherBounds.reduce(
            (closestBound, candidate) => {
                const distance = manhattanDistance(
                    boundsCenter(closestBound.item),
                    boundsCenter(candidate),
                );

                if (distance < closestBound.distance) {
                    return {
                        distance: distance,
                        item: candidate,
                    };
                } else {
                    return closestBound;
                }
            },
            { distance: Number.MAX_SAFE_INTEGER, item: otherBounds[0] },
        );

        const closestOtherBoundPoint = boundsCenter(closestOtherBound.item);
        const boundCenter = boundsCenter(bound);
        const path = manhattanPath(
            {
                x: Math.floor(boundCenter.x),
                y: Math.floor(boundCenter.y),
            },
            {
                x: Math.floor(closestOtherBoundPoint.x),
                y: Math.floor(closestOtherBoundPoint.y),
            },
        );

        if (path.length > 0) {
            removeItem(bounds, closestOtherBound.item);
            for (const point of path) {
                mountainMap.bounds.push({
                    x1: point.x,
                    y1: point.y,
                    x2: point.x + 1,
                    y2: point.y + 1,
                });
            }
        }
    }

    function connectionPointsToPoint(direction: Direction) {
        const connectionPointsInDirection =
            biomeMap.getConectionPointsForEdge(direction);

        let offset: Point = zeroPoint();
        switch (direction) {
            case Direction.Up:
                offset = zeroPoint();
                break;
            case Direction.Down:
                offset = { x: 0, y: 31 };
                break;
            case Direction.Left:
                offset = zeroPoint();
                break;
            case Direction.Right:
                offset = { x: 31, y: 0 };
                break;
        }

        return connectionPointsInDirection.map((connectionPoint) => {
            const axis = getAxis(direction);
            switch (axis) {
                case Axis.XAxis:
                    return addPoint(offset, { x: 0, y: connectionPoint });
                case Axis.YAxis:
                    return addPoint(offset, { x: connectionPoint, y: 0 });
            }
        });
    }

    const connectionPoints = [
        ...connectionPointsToPoint(Direction.Left),
        ...connectionPointsToPoint(Direction.Right),
        ...connectionPointsToPoint(Direction.Up),
        ...connectionPointsToPoint(Direction.Down),
    ];

    while (connectionPoints.length > 0) {
        const point = connectionPoints.pop();
        if (!point) {
            break;
        }

        const closestBound = originalBounds.reduce(
            (closest, candidate) => {
                const distance = manhattanDistance(
                    point,
                    boundsCenter(candidate),
                );

                if (distance < closest.distance) {
                    return {
                        distance: distance,
                        item: candidate,
                    };
                } else {
                    return closest;
                }
            },
            { distance: Number.MAX_SAFE_INTEGER, item: originalBounds[0] },
        );
        const closestBoundCenter = boundsCenter(closestBound.item);

        const path = manhattanPath(point, {
            x: Math.floor(closestBoundCenter.x),
            y: Math.floor(closestBoundCenter.y),
        });

        for (const point of path) {
            mountainMap.bounds.push({
                x1: point.x,
                y1: point.y,
                x2: point.x + 1,
                y2: point.y + 1,
            });
        }
    }
}

function blobbifyMountains() {
    //throw new Error("Function not implemented.");
}

function createStoneFromMountainMap(
    mountainMap: MountainMap,
    biomeMap: BiomeMap,
) {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            const point = { x, y };
            const withinBounds = mountainMap.bounds.some((bound) =>
                pointWithinBounds(point, bound),
            );

            if (!withinBounds) {
                biomeMap.setItem({
                    factory: mountainFactory,
                    name: "mountain",
                    point: point,
                    size: { x: 1, y: 1 },
                });
            }
        }
    }
}

function mountainFactory(
    item: BiomeMapItem,
    biome: BiomeMap,
    _allMaps: BiomeMapCollection,
    rootEntity: Entity,
) {
    const position = biome.worldPosition(item);
    const mountainEntity = new Entity(generateId("mountain"));
    mountainEntity.addComponent(new MountainComponent());
    mountainEntity.addComponent(new WeightComponent(100));
    mountainEntity.worldPosition = position;
    rootEntity.addChild(mountainEntity);
}
