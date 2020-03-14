import { action, emptyAction } from "../action";
import { Reducer } from "../reducer";
import {
    getChunk,
    TileCollection,
    Tile,
    getTile
} from "../../game/gameScene/world/chunk";
import { NumberRange } from "../../data/range";
import { NodeOperation } from "../../state/jsonOperations";
import { DataTree } from "../../state/dataNode";

export const tickActionName = "tick";
export function onTickAction() {
    return action(["tick"], emptyAction);
}

export const tickReducer: Reducer<{}> = (action, state) => {
    const currentTick = state.get(["tick"]).value<number>();
    const ops: NodeOperation[] = [];
    if (currentTick > 0) {
        //console.log("Spawn tile");
        const vertical = Math.random() > 0.5;
        const tiles = Object.entries(
            state.get(["world", "tiles"]).value<TileCollection>()
        );
        const axisRange: NumberRange = tiles
            .map((tile) => {
                return vertical ? tile[1].y : tile[1].x;
            })
            .reduce<NumberRange>(
                (previous, current) => {
                    return {
                        min: Math.min(previous.min, current),
                        max: Math.max(previous.max, current)
                    };
                },
                { min: 0, max: 0 }
            );

        const endSide = Math.random() > 0.5;

        const maxAxisValue = tiles
            .map((tile) => {
                return vertical ? tile[1].x : tile[1].y;
            })
            .reduce((previous, current) => {
                if (endSide) {
                    return Math.max(current, previous);
                } else {
                    return Math.min(current, previous);
                }
            }, 0);

        const rangeSize = Math.abs(axisRange.min - axisRange.max);
        const mainAxisPosition =
            Math.round(Math.random() * rangeSize) + axisRange.min;

        let op = null;
        if (Math.random() < 0.95) {
            op = addTileFromOutsideIn(
                endSide,
                maxAxisValue,
                vertical,
                mainAxisPosition,
                state
            );
        } else {
            op = addTileFromInsideOut(
                endSide,
                maxAxisValue,
                vertical,
                mainAxisPosition,
                state
            );
        }

        if (!!op) {
            ops.push(op);
        }
    }
    ops.push({
        operation: "set",
        path: ["tick"],
        data: currentTick + 1
    });
    return ops;
};

function addTileFromInsideOut(
    endSide: boolean,
    maxAxisValue: number,
    vertical: boolean,
    mainAxisPosition: number,
    state: DataTree
): NodeOperation {
    let step = Math.floor(maxAxisValue * 0.6);
    let op = null;
    while (step < 1000) {
        const crossAxisPosition = endSide ? 0 - step : 0 + step;

        const key = vertical
            ? `x${crossAxisPosition}y${mainAxisPosition}`
            : `x${mainAxisPosition}y${crossAxisPosition}`;

        if (!state.get(["world", "tiles", key]).value<Tile>()) {
            op = {
                operation: "set",
                path: ["world", "tiles", key],
                data: getTile({
                    x: vertical ? crossAxisPosition : mainAxisPosition,
                    y: vertical ? mainAxisPosition : crossAxisPosition
                })
            };
            break;
        }
        step++;
    }

    return op;
}

function addTileFromOutsideIn(
    endSide: boolean,
    maxAxisValue: number,
    vertical: boolean,
    mainAxisPosition: number,
    state: DataTree
): NodeOperation {
    let op: NodeOperation = null;
    //Move from maxAxis value and towards 0
    for (let i = 0; i <= Math.abs(maxAxisValue); i++) {
        const crossAxisPosition = endSide ? maxAxisValue - i : maxAxisValue + i;

        const key = vertical
            ? `x${crossAxisPosition}y${mainAxisPosition}`
            : `x${mainAxisPosition}y${crossAxisPosition}`;

        if (!!state.get(["world", "tiles", key]).value<Tile>()) {
            const newCrossAxisPosition = endSide
                ? crossAxisPosition + 1
                : crossAxisPosition - 1;
            const newKey = vertical
                ? `x${newCrossAxisPosition}y${mainAxisPosition}`
                : `x${mainAxisPosition}y${newCrossAxisPosition}`;
            op = {
                operation: "set",
                path: ["world", "tiles", newKey],
                data: getTile({
                    x: vertical ? newCrossAxisPosition : mainAxisPosition,
                    y: vertical ? mainAxisPosition : newCrossAxisPosition
                })
            };
            break;
        }
    }

    return op;
}
