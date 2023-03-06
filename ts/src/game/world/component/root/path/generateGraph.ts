import { absBounds } from "../../../../../common/bounds";
import { InvalidArgumentError } from "../../../../../common/error/invalidArgumentError";
import { Graph } from "../../../../../path/graph";
import { Entity } from "../../../entity/entity";
import { TilesComponent } from "../../tile/tilesComponent";

/**
 * Creates a graph based on the given world
 * @param rootEntity
 * @returns a [Graph] based on the entities in the world for pathfinding
 */
export function createGraphFromNodes(rootEntity: Entity): Graph {
    const groundComponent = rootEntity.getComponent(TilesComponent);
    if (!groundComponent) {
        throw new InvalidArgumentError("Root entity needs a tiles component");
    }

    const bounds = groundComponent.getBounds();

    const offsetBounds = absBounds(bounds);
    const weightGraph: number[][] = [];
    for (let x = 0; x <= offsetBounds.bounds.x2; x++) {
        weightGraph[x] = [];
        for (let y = 0; y <= offsetBounds.bounds.y2; y++) {
            let weight = 1000;
            const tilePositionXWithoutOffset = x - offsetBounds.offsets.x;
            const tilePositionYWithoutOffset = y - offsetBounds.offsets.y;

            const ground = groundComponent.getTile({
                x: tilePositionXWithoutOffset,
                y: tilePositionYWithoutOffset,
            });
            if (ground) {
                if (ground.hasTree) {
                    weight = 20;
                } else {
                    weight = 5;
                }
            } else {
                weight = 0;
            }

            weightGraph[x][y] = weight;
        }
    }

    const graph = new Graph(
        weightGraph,
        offsetBounds.offsets.x,
        offsetBounds.offsets.y
    );
    return graph;
}
