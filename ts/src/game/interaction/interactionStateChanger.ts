import { InteractionState } from "./interactionState";

export interface InteractionStateChanger {
    push(state: InteractionState): void;
    replace(state: InteractionState): void;
    pop(): void;
    clear(): void;
}
