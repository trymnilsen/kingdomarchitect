import { Point } from "../common/point.js";

export type SearchedNode = {
    x: number;
    y: number;
    weight: number;
    g: number;
    visited: boolean;
    totalCost: number;
};

export type SearchResult = {
    path: Point[];
    graph: SearchedNode[];
};
