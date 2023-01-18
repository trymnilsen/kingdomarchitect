import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { EntityComponent } from "../entityComponent";
import { HealthEvent } from "./healthEvent";

export class HealthComponent extends EntityComponent {
    private _health: number;
    private _maxHealth: number;

    public get healthPercentage(): number {
        return this._health / this._maxHealth;
    }

    public get health(): number {
        return this._health;
    }

    constructor(currentHealth: number, maxHealth: number) {
        super();
        this._health = currentHealth;
        this._maxHealth = maxHealth;
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
        this._health = newHealth;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, this));
        return 0;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        if (this._health > 0 && this._health < this._maxHealth) {
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
