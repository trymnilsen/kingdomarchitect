import { EntityComponent } from "../entityComponent";

type MovementBundle = {};

export class MovementComponent extends EntityComponent<MovementBundle> {
    shuffle(): boolean {
        return true;
    }
    override fromComponentBundle(_bundle: MovementBundle): void {
        throw new Error("Method not implemented.");
    }
    override toComponentBundle(): MovementBundle {
        throw new Error("Method not implemented.");
    }
}
