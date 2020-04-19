import { Event, EventListener } from "../../event/event";
import { Point, addPoint, changeX, changeY } from "../../data/point";
import { Direction } from "../../data/direction";

export type GameStateUpdatedNotifier = () => void;
export type TileMap = { [id: string]: Tile };

const maxStone = 5;
const maxTree = 12;

export class GameState {
    uiState: UiState;
    playerState: PlayerState;
    toasts: UiToastEntry[];
    tiles: TileMap;
    constructor() {
        this.playerState = new PlayerState();
        this.uiState = new UiState();

        this.tiles = {};
        this.tiles[getTileKey({ x: 3, y: 3 })] = {
            x: 3,
            y: 3,
            items: [
                {
                    impassable: true,
                    type: CAMPFIRE_TILE_ITEM_TYPE,
                },
            ],
        };
        let numberOfStone = 0;
        let numberOfTree = 0;
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const tileKey = getTileKey({ x, y });
                if (!this.tiles[tileKey]) {
                    const items: TileItem[] = [];
                    const spawnChance = Math.random();
                    if (spawnChance > 0.8 && x !== 3 && y !== 4) {
                        if (Math.random() > 0.5) {
                            if (numberOfStone < maxStone) {
                                items.push({
                                    impassable: true,
                                    type: STONE_TILE_ITEM_TYPE,
                                });
                                numberOfStone++;
                            }
                        } else {
                            if (numberOfTree < maxTree) {
                                items.push({
                                    impassable: true,
                                    type: TREE_TILE_ITEM_TYPE,
                                });
                                numberOfTree++;
                            }
                        }
                    }
                    this.tiles[tileKey] = {
                        x,
                        y,
                        items,
                    };
                }
            }
        }
        console.log("Generated map: ", this.tiles);
    }
    showToast(message: String) {}
    uiOpen(): boolean {
        return this.uiState.windows.length > 0;
    }
}

export interface UiToastEntry {
    expiry: number;
    value: string;
}

export class UiState {
    windows: UiWindow[] = [];

    pushUiList(items: UiListItem[]) {
        const window: UiWindow = {
            type: UiWindowType.List,
            focusedIndex: 0,
            options: items,
        };
        this.windows.push(window);
    }

    pushChatBox(messages: string[]) {
        const window: UiWindow = {
            type: UiWindowType.ChatBox,
            messages: messages,
        };
        this.windows.push(window);
    }

    pop() {
        this.windows.pop();
    }
}

export type UiWindow = UiList | UiChatBox;
export enum UiWindowType {
    List,
    ChatBox,
}

export interface UiChatBox {
    type: UiWindowType.ChatBox;
    messages: string[];
}

export interface UiList {
    type: UiWindowType.List;
    focusedIndex: number;
    options: UiListItem[];
}

export interface UiListItem {
    action: string;
    label: string;
}

export class PlayerState {
    position: Point;
    direction: Direction;
    constructor() {
        this.position = { x: 3, y: 4 };
    }
}

export function getTileKey(point: Point) {
    return `x${point.x}y${point.y}`;
}

export interface Tile {
    x: number;
    y: number;
    items: TileItem[];
}

export interface TileItem {
    impassable: boolean;
    type: string;
}

export const CAMPFIRE_TILE_ITEM_TYPE = "campfire";
export const STONE_TILE_ITEM_TYPE = "stone";
export const TREE_TILE_ITEM_TYPE = "tree";
