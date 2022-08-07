import { withinRectangle } from "../common/bounds";
import { distance, Point } from "../common/point";
import { Graph } from "../path/graph";
import { PathSearch } from "../path/search";
import { RoadVisual } from "../rendering/visual/roadVisual";
import { BuildingTile } from "./entity/buildings";
import { Ground } from "./entity/ground";

export function getStartBuildings(world: Ground): BuildingTile[] {
    const buildings: BuildingTile[] = [];
    //Place castle
    const castle: BuildingTile = {
        sprite: "keep",
        x: 3,
        y: 3,
        offset: {
            x: 8,
            y: 8,
        },
    };
    buildings.push(castle);
    //Get tiles for possible houses
    const tiles = world.getTiles((tile) => {
        const tilePosition = {
            x: tile.tileX,
            y: tile.tileY,
        };

        if (
            withinRectangle(tilePosition, 1, 1, 8, 8) &&
            !withinRectangle(tilePosition, 2, 2, 6, 6)
        ) {
            return true;
        } else {
            return false;
        }
    });
    const graph = generateGraph(buildings);
    const pathFinder = new PathSearch(graph);

    for (let i = 0; i < 2; i++) {
        const randomItemIndex = Math.floor(Math.random() * tiles.length);
        const position = tiles[randomItemIndex];
        tiles.splice(randomItemIndex, 1);
        const building: BuildingTile = {
            sprite: "woodHouse",
            x: position.tileX,
            y: position.tileY,
        };

        buildings.push(building);
        //Find the path from this to the castle
        const path = pathFinder.search(
            { x: 4, y: 5 },
            { x: position.tileX, y: position.tileY }
        );
        // Remove the last item (where the house is)
        path.pop();
        // Add all the items
        for (const pathItem of path) {
            buildings.push({
                x: pathItem.x,
                y: pathItem.y,
                weight: 1,
                visual: new RoadVisual({
                    x: pathItem.x,
                    y: pathItem.y,
                }),
            });
        }
        pathFinder.updateGraph(generateGraph(buildings));
    }

    return buildings;
}

function generateGraph(buildings: BuildingTile[]) {
    const weightGraph: number[][] = [];
    for (let x = 0; x < 10; x++) {
        weightGraph[x] = [];
        for (let y = 0; y < 10; y++) {
            weightGraph[x][y] = 10;
        }
    }

    for (const building of buildings) {
        weightGraph[building.x][building.y] = building.weight || 0;
    }

    //add weights for the castle
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            weightGraph[x + 2][y + 2] = 0;
        }
    }
    //Remove the weight in front of the castle
    weightGraph[4][6] = 1;

    return new Graph(weightGraph, 0, 0);
}
