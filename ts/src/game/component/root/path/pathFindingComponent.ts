import { TypedEventHandle } from "../../../../common/event/typedEvent.js";
import { addPoint, Point, pointEquals } from "../../../../common/point.js";
import { GraphNode } from "../../../../module/path/graph/graph.js";
import { PathSearch } from "../../../../module/path/search.js";
import { EntityComponent } from "../../entityComponent.js";
import { TileMapUpdateEvent } from "../../tile/tileMapUpdatedEvent.js";
import { createLazyGraphFromRootNode } from "./generateGraph.js";
import { PathResult, PathResultStatus } from "./pathResult.js";

export class PathFindingComponent extends EntityComponent {
    private tileEventListener: TypedEventHandle | undefined;
    protected pathSearch: PathSearch | null = null;

    constructor() {
        super();
    }

    override onStart(): void {
        this.pathSearch = new PathSearch(
            createLazyGraphFromRootNode(this.entity.getRootEntity()),
        );
        this.tileEventListener = this.entity.componentEvents.listen(
            TileMapUpdateEvent,
            () => {
                this.invalidateGraphPoint({ x: 0, y: 0 });
            },
        );

        //TODO: invalidate graph on movement
    }

    override onStop(): void {
        this.tileEventListener?.dispose();
    }

    findPath(from: Point, to: Point, blockBuildings?: boolean): PathResult {
        if (!this.pathSearch) {
            throw new Error("Cannot find path, no pathsearch set");
        }

        const offsetPoint = this.pathSearch.offset;
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
        const result = this.pathSearch.search(
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

    invalidateGraphPoint(point: Point) {
        if (!this.pathSearch) {
            throw new Error("Cannot invalidate point, pathsearch is null");
        }
        this.pathSearch.invalidateGraphPoint(point);
    }
}

const defaultWeightModifier = (node: GraphNode) => node.weight;
const blockBuildingsModifier = (node: GraphNode) => {
    return node.weight >= 20 ? 0 : node.weight;
};
