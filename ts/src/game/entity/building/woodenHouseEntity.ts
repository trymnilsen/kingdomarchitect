import { Point } from "../../../common/point";
import { BuildingTile } from "../buildings";

export function woodHouseEntity(point: Point): BuildingTile {
    return {
        x: point.x,
        y: point.y,
        sprite: "woodHouse",
    };
}

export function woodHouseScaffold(point: Point): BuildingTile {
    return {
        x: point.x,
        y: point.y,
        sprite: "woodHouseScaffold",
    };
}
