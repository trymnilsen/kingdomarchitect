import { Point } from "../../../../common/point.js";
import { NumberRange } from "../../../../common/range.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthEvent } from "./healthEvent.js";

export class HealthComponent extends EntityComponent {
    private _health: number;
    private _maxHealth: number;
    private _showHealthBarThreshold: NumberRange;

    /*
     * Returns the health as a percentage between 0.0 and 1.0
     */
    public get healthPercentage(): number {
        return this._health / this._maxHealth;
    }

    public get health(): number {
        return this._health;
    }

    constructor(
        currentHealth: number,
        maxHealth: number,
        showHealthBarThreshold: NumberRange = { min: 0, max: maxHealth }
    ) {
        super();
        this._health = currentHealth;
        this._maxHealth = maxHealth;
        this._showHealthBarThreshold = showHealthBarThreshold;
    }

    damage(amount: number): number {
        const oldHealth = this._health;
        const newHealth = oldHealth - amount;
        this._health = newHealth;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, this));
        return 0;
    }

    heal(amount: number): number {
        const oldHealth = this._health;
        const newHealth = oldHealth + amount;
        if (newHealth > this._maxHealth) {
            this._health = this._maxHealth;
        } else {
            this._health = newHealth;
        }

        this.publishEvent(new HealthEvent(oldHealth, this._health, this));
        return 0;
    }

    healToMax(): number {
        const oldHealth = this._health;
        const newHealth = this._maxHealth;
        this._health = newHealth;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, this));
        return 0;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        if (
            this._health > this._showHealthBarThreshold.min &&
            this._health < this._showHealthBarThreshold.max
        ) {
            const drawSize = 40;
            const healthbarY = screenPosition.y + 40 - 16;
            const healthbarWidth = drawSize - 10;
            const healthbarX = screenPosition.x + 4;

            context.drawScreenSpaceRectangle({
                x: healthbarX,
                y: healthbarY,
                width: healthbarWidth,
                height: 8,
                fill: "black",
            });

            context.drawScreenSpaceRectangle({
                x: healthbarX + 2,
                y: healthbarY + 2,
                width: Math.max(healthbarWidth * this.healthPercentage - 4, 4),
                height: 4,
                fill: "green",
            });
        }
    }
}
