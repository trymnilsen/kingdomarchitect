import { EntityComponent } from "../entityComponent";

type MovementBundle = {};

export class MovementComponent extends EntityComponent<MovementBundle> {
    /**
     * The concept of shuffling is to "move out of the way". Another actor or
     * movement component can request that actors it considers in the way to
     * move. The movement component on the actor being asked to move will
     * then check for available space to move out of the way to. This is first
     * performed perpendicular to the incomming movement, otherwise movement in
     * same direction is checked, but this yields a higher weight. If there is
     * no way to move to, a weight of 0 is returned.
     * @returns 0 if shuffling is not possible, otherwise the weight to shuffle
     */
    shuffle(): number {
        return 0.0;
    }
    override fromComponentBundle(_bundle: MovementBundle): void {
        throw new Error("Method not implemented.");
    }
    override toComponentBundle(): MovementBundle {
        throw new Error("Method not implemented.");
    }
}
