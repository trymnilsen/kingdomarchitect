function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { EntityComponent } from "../entityComponent.js";
import { HealthEvent } from "./healthEvent.js";
export class HealthComponent extends EntityComponent {
    /*
     * Returns the health as a percentage between 0.0 and 1.0
     */ get healthPercentage() {
        return this._health / this._maxHealth;
    }
    get health() {
        return this._health;
    }
    damage(amount) {
        const oldHealth = this._health;
        const newHealth = oldHealth - amount;
        this._health = newHealth;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, this));
        return 0;
    }
    heal(amount) {
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
    healToMax() {
        const oldHealth = this._health;
        const newHealth = this._maxHealth;
        this._health = newHealth;
        this.publishEvent(new HealthEvent(oldHealth, newHealth, this));
        return 0;
    }
    onDraw(context, screenPosition) {
        if (this._health > this._showHealthBarThreshold.min && this._health < this._showHealthBarThreshold.max) {
            const drawSize = 40;
            const healthbarY = screenPosition.y + 40 - 16;
            const healthbarWidth = drawSize - 10;
            const healthbarX = screenPosition.x + 4;
            context.drawScreenSpaceRectangle({
                x: healthbarX,
                y: healthbarY,
                width: healthbarWidth,
                height: 8,
                fill: "black"
            });
            context.drawScreenSpaceRectangle({
                x: healthbarX + 2,
                y: healthbarY + 2,
                width: Math.max(healthbarWidth * this.healthPercentage - 4, 4),
                height: 4,
                fill: "green"
            });
        }
    }
    constructor(currentHealth, maxHealth, showHealthBarThreshold = {
        min: 0,
        max: maxHealth
    }){
        super();
        _define_property(this, "_health", void 0);
        _define_property(this, "_maxHealth", void 0);
        _define_property(this, "_showHealthBarThreshold", void 0);
        this._health = currentHealth;
        this._maxHealth = maxHealth;
        this._showHealthBarThreshold = showHealthBarThreshold;
    }
}
