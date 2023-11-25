import { InvalidArgumentError } from "../../../common/error/invalidArgumentError.js";
import { EntityComponent } from "../entityComponent.js";

type EnergyBundle = {
    amount: number;
};

export class EnergyComponent extends EntityComponent<EnergyBundle> {
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

    override fromComponentBundle(bundle: EnergyBundle): void {
        this.currentAmount = bundle.amount;
    }
    override toComponentBundle(): EnergyBundle {
        return {
            amount: this.currentAmount,
        };
    }
}
