import { InvalidArgumentError } from "../../../common/error/invalidArgumentError.js";
import { EntityComponent } from "../entityComponent.js";

export class EnergyComponent extends EntityComponent {
    private currentAmount: number = 0;

    public get energy(): number {
        return this.currentAmount;
    }

    decrementEnergy(amount: number) {
        if (amount < 0) {
            throw new InvalidArgumentError(
                "Cannot decrement with a negative value",
            );
        }
        this.currentAmount = Math.max(0, this.currentAmount - amount);
    }

    incrementEnergy(amount: number) {
        if (amount < 0) {
            throw new InvalidArgumentError(
                "Cannot increment with a negative value",
            );
        }
        this.currentAmount = this.currentAmount + amount;
    }

    setEnergy(amount: number) {
        this.currentAmount = Math.max(0, amount);
    }
}
