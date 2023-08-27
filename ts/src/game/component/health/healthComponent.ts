import { Point } from "../../../common/point.js";
import {
    NumberRange,
    zeroRange as zeroNumberRange,
} from "../../../common/range.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthEvent } from "./healthEvent.js";

type HealthBundle = {
    health: number;
    maxHealth: number;
    showHealthbarThreshold: NumberRange;
};

export class HealthComponent extends EntityComponent<HealthBundle> {
    private _health: number = 0;
    private _maxHealth: number = 0;
    private _showHealthBarThreshold: NumberRange = zeroNumberRange();
    private healthBubble: number = 0;
    private tickTime: number = 0;

    /*
     * Returns the health as a percentage between 0.0 and 1.0
     */
    public get healthPercentage(): number {
        return this._health / this._maxHealth;
    }

    public get health(): number {
        return this._health;
    }

    static createInstance(
        currentHealth: number,
        maxHealth: number,
        showHealthBarThreshold: NumberRange = { min: 0, max: maxHealth }
    ): HealthComponent {
        const instance = new HealthComponent();
        instance.fromComponentBundle({
            health: currentHealth,
            maxHealth: maxHealth,
            showHealthbarThreshold: showHealthBarThreshold,
        });
        return instance;
    }

    /**
     * Add damage from a source to this component
     * @param amount the amount of damage inflicted
     * @param source the entity that caused this damage
     * @returns
     */
    damage(amount: number, source: Entity): number {
        const oldHealth = this._health;
        const newHealth = Math.max(0, oldHealth - amount);
        this._health = newHealth;
        this.healthBubble = amount;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, source, this));
        return 0;
    }

    /**
     * Remove damage from this component, effectively healing them
     * @param amount the amount of damage to heal
     * @param source the entity that gave/caused the healing to happen
     * @returns
     */
    heal(amount: number): number {
        const oldHealth = this._health;
        const newHealth = Math.min(oldHealth + amount, this._maxHealth);
        this._health = newHealth;

        this.publishEvent(new HealthEvent(oldHealth, this._health, null, this));
        return 0;
    }

    /**
     * Heal the component to its max health
     * @returns always 0
     */
    healToMax(): number {
        const oldHealth = this._health;
        const newHealth = this._maxHealth;
        this._health = newHealth;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, null, this));
        return 0;
    }

    override onUpdate(tick: number): void {
        if (this.healthBubble !== 0) {
            if (this.tickTime === 0) {
                this.tickTime = tick;
            }

            if (tick - this.tickTime >= 2) {
                this.healthBubble = 0;
                this.tickTime = 0;
            }
        }
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

        if (this.healthBubble !== 0) {
            context.drawText({
                x: screenPosition.x,
                y: screenPosition.y - 16,
                text: this.healthBubble.toString(),
                size: 12,
                font: "arial",
                color: this.healthBubble < 0 ? "lime" : "red",
            });
        }
    }

    override fromComponentBundle(bundle: HealthBundle): void {
        this._health = bundle.health;
        this._maxHealth = bundle.maxHealth;
        this._showHealthBarThreshold = bundle.showHealthbarThreshold;
    }

    override toComponentBundle(): HealthBundle {
        return {
            health: this._health,
            maxHealth: this._maxHealth,
            showHealthbarThreshold: this._showHealthBarThreshold,
        };
    }
}
