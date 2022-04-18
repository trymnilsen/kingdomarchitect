import { InteractionState } from "./interactionState";

export interface InteractionStateChanger {
    push(state: InteractionState): Promise<unknown>;
    replace(state: InteractionState): void;
    pop(): void;
    clear(): void;
}

export class CommitableInteractionStateChanger
    implements InteractionStateChanger
{
    push(state: InteractionState): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    replace(state: InteractionState): void {
        throw new Error("Method not implemented.");
    }
    pop(): void {
        throw new Error("Method not implemented.");
    }
    clear(): void {
        throw new Error("Method not implemented.");
    }
}
