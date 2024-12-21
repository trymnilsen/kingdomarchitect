import { addPoint, Point, pointEquals } from "../../../common/point.js";
import { EcsEntity } from "../../../ecs/ecsEntity.js";
import { EcsWorldScope, RootEntity } from "../../../ecs/ecsWorldScope.js";
import { pathSearch } from "../../../path/pathSearch.js";
import {
    blockBuildingsModifier,
    defaultWeightModifier,
} from "../../../path/searchModifier.js";
import {
    PathResult,
    PathResultStatus,
} from "../../component/root/path/pathResult.js";
import { ChunkMapComponent } from "./chunkmapComponent.js";
import { PathfindingComponent } from "./pathfindingComponent.js";
import { TileComponent } from "./tileComponent.js";

export function queryPointForEntities(
    world: EcsWorldScope,
    point: Point,
): EcsEntity[] {
    const chunkmap = world.components.getComponent(
        RootEntity,
        ChunkMapComponent,
    );

    if (!chunkmap) {
        return [];
    }

    return chunkmap.getAt(point);
}

export function queryWeight(world: EcsWorldScope, point: Point): number {
    const tiles = world.components.getComponent(RootEntity, TileComponent);
    if (!tiles) {
        console.log("No tile component on root, returning 0 as weight");
        return 0;
    }

    const tileAt = tiles.getTile(point.x, point.y);
    if (!tileAt) {
        //There was no tile at the position, likely outside of the map
        return 0;
    }

    const entities = queryPointForEntities(world, point);
    if (entities.length == 0) {
        //There was no entity at the point, make it available
        return 1;
    }

    return 50;
}

export function queryPath(
    world: EcsWorldScope,
    from: Point,
    to: Point,
    blockBuildings: boolean = false,
): PathResult {
    const pathSearchComponent = world.components.getComponent(
        RootEntity,
        PathfindingComponent,
    );

    if (!pathSearchComponent) {
        throw new Error("No path search");
    }

    const offsetPoint = pathSearchComponent.graph.offset;
    const offsetFrom = addPoint(from, {
        x: offsetPoint.x,
        y: offsetPoint.y,
    });
    const offsetTo = addPoint(to, {
        x: offsetPoint.x,
        y: offsetPoint.y,
    });

    // To handle cases where we want to search up until the to node
    // for example finding the route to a building but not up on the
    // building itself we will override the partial search but rememeber it.
    // Once the search is complete we check if the final position in
    // the path that has been searched is adjacent to the to point or tile
    // this adjency handles multi-tiles. I.e the points might not be
    // adjacent on a grid, but they might be considered adjacent if the
    // to point is inside a building that stretches across multiple
    // tiles and one of the tiles belonging to the building is adjacent
    // to the last path point
    const weightModifier = blockBuildings
        ? blockBuildingsModifier
        : defaultWeightModifier;

    // Perform the search
    const result = pathSearch(
        pathSearchComponent.graph,
        offsetFrom,
        offsetTo,
        true,
        weightModifier,
    );

    // The path results are returned in a absolute space, so we convert them
    // back before doing any further work on it
    const path = result.path.map((item) => {
        return {
            x: item.x - offsetPoint.x,
            y: item.y - offsetPoint.y,
        };
    });
    if (path.length == 0) {
        return {
            status: PathResultStatus.None,
            path: [],
            graph: result.graph,
        };
    }

    // Now we have a search result, check if the end of the path is adjacent
    // to the end point if needed
    const lastPathPoint = path[path.length - 1];
    if (pointEquals(lastPathPoint, to)) {
        return {
            status: PathResultStatus.Complete,
            path: path,
            graph: result.graph,
        };
    } else {
        return {
            status: PathResultStatus.Partial,
            path: path,
            graph: result.graph,
        };
    }
}
