import { SimulationEvent } from "../../simulation/simulation";
import { NodeOperation } from "../../jsontree/nodeOperations";
import { Action } from "../../simulation/action";

export type GameEvent =
    | JoinGameEvent
    | ActionGameEvent
    | StateOperationsGameEvent;
export interface JoinGameEvent {
    id: "join";
    data: string;
}
export interface ActionGameEvent {
    id: "action";
    data: Action;
}
export interface StateOperationsGameEvent {
    id: "sync";
    data: NodeOperation[];
}
