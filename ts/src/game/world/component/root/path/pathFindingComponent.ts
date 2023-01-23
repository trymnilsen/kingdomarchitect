import { TypedEventHandle } from "../../../../../common/event/typedEvent";
import { addPoint, Point, pointEquals } from "../../../../../common/point";
import { GraphNode } from "../../../../../path/graph";
import { PathSearch } from "../../../../../path/search";
import { EntityComponent } from "../../entityComponent";
import { TileMapUpdateEvent } from "../../tile/tileMapUpdatedEvent";
import { PathResult, PathResultStatus } from "./pathResult";

export class PathFindingComponent extends EntityComponent {
    private tileEventListener: TypedEventHandle | undefined;

    constructor(private pathSearch: PathSearch) {
        super();
    }

    override onStart(tick: number): void {
        this.tileEventListener = this.entity!.componentEvents.listen(
            TileMapUpdateEvent,
            (event) => {
                this.invalidateCurrentGraph();
            }
        );
    }

    override onStop(tick: number): void {
        this.tileEventListener?.dispose();
    }

    public findPath(
        from: Point,
        to: Point,
        blockBuildings?: Boolean
    ): PathResult {
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
        // this adjency handles multi-tiles. I.e the points might not be adjacent
        // on a grid, but they might be considered adjacent if the to point is
        // inside a building that stretches across multiple tiles and one of the
        // tiles belonging to the building is adjacent to the last path point
        const weightModifier = !!blockBuildings
            ? blockBuildingsModifier
            : defaultWeightModifier;

        // Perform the search
        const result = this.pathSearch.search(
            offsetFrom,
            offsetTo,
            true,
            weightModifier
        );

        // The path results are returned in a absolute space, so we convert them
        // back before doing any further work on it
        const path = result.map((item) => {
            return {
                x: item.x - offsetPoint.x,
                y: item.y - offsetPoint.y,
            };
        });
        if (path.length == 0) {
            return {
                status: PathResultStatus.None,
                path: [],
            };
        }

        // Now we have a search result, check if the end of the path is adjacent
        // to the end point if needed
        const lastPathPoint = path[path.length - 1];
        if (pointEquals(lastPathPoint, to)) {
            return {
                status: PathResultStatus.Complete,
                path: path,
            };
        } else {
            return {
                status: PathResultStatus.Partial,
                path: path,
            };
        }
    }

    private invalidateCurrentGraph() {
        this.pathSearch.invalidateGraph();
    }
}

const defaultWeightModifier = (node: GraphNode) => node.weight;
const blockBuildingsModifier = (node: GraphNode) => {
    return node.weight >= 100 ? 0 : node.weight;
};
