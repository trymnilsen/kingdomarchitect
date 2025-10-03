# Consumable Items and Effects System Implementation

## Overview

This document describes the implementation of a consumable items and effects system that allows items (like health potions) to apply effects to entities when consumed. The system is **server-authoritative** - effects are processed only on the server, with the client receiving updates via component replication.

## Components

### 1. ActiveEffectsComponent (`activeEffectsComponent.ts`)

A new component that holds active effects on an entity.

```typescript
export type ActiveEffect = {
    effect: Effect;
    remainingTicks: number;
    ticksSinceLastApplication: number;
};

export type ActiveEffectsComponent = {
    id: "activeEffects";
    effects: ActiveEffect[];
};
```

**Key Functions:**
- `createActiveEffectsComponent()`: Creates a new component with an empty effects array
- `addEffect(component, effect)`: Adds an effect to the entity with appropriate timing
- `removeEffect(component, index)`: Removes an effect by index

**Replication:** This component is replicated to clients automatically via the `replicatedEntitiesSystem`, allowing clients to visualize active effects without processing them.

### 2. Effect System (`effectSystem.ts`)

A new ECS system that processes active effects on entities each update tick. **This system runs ONLY on the server.**

**How it works:**
1. Queries all entities with `ActiveEffectsComponent`
2. For each effect, processes based on timing type:
   - **Immediate**: Applies effect instantly and removes it
   - **Delayed**: Counts down ticks, applies when ready, then removes
   - **Periodic**: Applies effect every `interval` ticks for `ticks` duration
3. Removes expired effects from the component
4. Notifies the entity that the component has changed (triggers replication to clients)

**Effect Application:**
The system uses a switch statement on `effect.id` to determine how to apply each effect:
- `healEffectId`: Heals the entity's HealthComponent

### 3. Effect Definition (`effect.ts`)

Effects support three timing modes:

```typescript
export type EffectTiming =
    | { type: "immediate" }                              // Apply instantly
    | { type: "delayed"; ticks: number }                 // Apply after N ticks
    | { type: "periodic"; ticks: number; interval: number }; // Apply every interval for duration

export type Effect<T = JSONValue> = {
    id: string;
    timing: EffectTiming;
    data: T;
    name: string;
    sprite: Sprite2Id;
};
```

**Examples:**

```typescript
// Instant heal
createHealEffect(5) 
// → { timing: { type: "immediate" } }

// Delayed heal (applies after 60 ticks)
{ timing: { type: "delayed", ticks: 60 } }

// Heal over time (5 HP every 10 ticks for 100 ticks = 10 applications)
createHealOverTimeEffect(5, 100, 10)
// → { timing: { type: "periodic", ticks: 100, interval: 10 } }
```

### 4. ConsumeItemCommand (`consumeItemCommand.ts`)

A new command that allows consuming an item from an entity's inventory.

```typescript
export type ConsumeItemCommand = {
    id: "consumeItem";
    itemId: string;
    entity: string;
};
```

### 5. Command Handler (in `commandSystem.ts`)

The `consumeItem` function handles the consume command:

1. Finds the target entity
2. Gets the entity's inventory
3. Looks up the item definition
4. Checks if an effect factory exists for the item
5. Removes one item from inventory
6. Creates an effect using the item's effect factory
7. Gets or creates the ActiveEffectsComponent
8. Adds the effect to the entity
9. Notifies changes to inventory and effects components (triggers replication)

## Server-Only Processing

**Key Design Decision:** The effect system runs ONLY on the server for authoritative game logic.

**Why?**
- Prevents client-side cheating
- Ensures consistent game state
- Simplifies synchronization

**How clients see effects:**
1. Server processes effect and updates `ActiveEffectsComponent`
2. Component change triggers `invalidateComponent()`
3. `replicatedEntitiesSystem` sends component update to all clients
4. Clients receive and display the effect state (e.g., in UI or visual feedback)
5. Clients never process effects themselves

## Effect Timing Types

### Immediate Effects
Apply instantly on the next server tick.

```typescript
export function createHealEffect(amount: number): HealEffect {
    return {
        data: { amount },
        id: healEffectId,
        name: "Healing",
        sprite: "health_potion",
        timing: { type: "immediate" },
    };
}
```

**Use cases:** Health potions, mana potions, instant buffs

### Delayed Effects
Apply after a specific number of ticks.

```typescript
{
    timing: { type: "delayed", ticks: 60 }, // Apply after 60 ticks
}
```

**Use cases:** Timed bombs, delayed damage, "take effect in 3 seconds"

### Periodic Effects (Over Time)
Apply repeatedly at intervals for a duration.

```typescript
export function createHealOverTimeEffect(
    amount: number,
    ticks: number,
    interval: number = 1,
): HealEffect {
    return {
        data: { amount },
        id: healEffectId,
        name: "Regeneration",
        sprite: "health_potion",
        timing: { type: "periodic", ticks, interval },
    };
}
```

**Use cases:** Regeneration, damage over time, continuous buffs

**Example:** `createHealOverTimeEffect(2, 100, 10)` heals 2 HP every 10 ticks for 100 ticks total (10 applications = 20 HP total)

## Effect Definition

Effects are defined with a `time` property (in ticks):
- **time = 0**: Immediate effect (applied on next update tick)
- **time > 0**: Delayed effect (applied after N ticks)

Example:
```typescript
export function createHealEffect(amount: number): HealEffect {
    return {
        data: { amount },
        id: healEffectId,
        name: "Healing",
        sprite: "health_potion",
        timing: { type: "immediate" },
    };
}
```

## Item Effect Factory System

The existing `itemEffectFactoryList` maps item IDs to effect factory functions:

```typescript
export const itemEffectFactoryList: { [id: string]: EffectFactory } = {
    [healthPotion.id]: healthPotionFactory,
};
```

**Adding new consumable items:**
1. Define the effect (e.g., `createNewEffect()`)
2. Create an effect factory function
3. Add the mapping to `itemEffectFactoryList`
4. Mark the item with `ItemTag.Consumable`

## UI Integration

### Worker Selection Provider

Updated to show different buttons based on equipped item type:

**Consumable items:**
- Unequip
- **Consume** (dispatches ConsumeItemCommand)

**Non-consumable items:**
- Unequip
- Attack

## System Registration

The `effectSystem` is registered **ONLY on the server** (`gameServer.ts`):
- Server processes all effects authoritatively
- Client receives updates via component replication
- No risk of client-side manipulation

## Example Usage

### Creating a new consumable with instant effect:

```typescript
// 1. Define the effect (instantEffect.ts)
export const instantManaEffectId = "instantManaEffect";
export function createInstantManaEffect(amount: number): Effect {
    return {
        data: { amount },
        id: instantManaEffectId,
        name: "Mana Restore",
        sprite: "mana_potion",
        timing: { type: "immediate" },
    };
}

// 2. Create effect factory (manaPotionFactory.ts)
export function manaPotionFactory(_item: InventoryItem): Effect {
    return createInstantManaEffect(10);
}

// 3. Register in factory list
export const itemEffectFactoryList = {
    [healthPotion.id]: healthPotionFactory,
    [manaPotion.id]: manaPotionFactory,
};

// 4. Handle in effect system
function applyEffect(entity: Entity, effect: Effect): void {
    switch (effect.id) {
        case healEffectId: { /* ... */ break; }
        case instantManaEffectId: { 
            // Restore mana logic
            break;
        }
    }
}
```

### Creating a poison effect (damage over time):

```typescript
// poisonEffect.ts
export const poisonEffectId = "poisonEffect";
export function createPoisonEffect(damagePerTick: number, duration: number): Effect {
    return {
        data: { damage: damagePerTick },
        id: poisonEffectId,
        name: "Poisoned",
        sprite: "poison_effect",
        timing: { 
            type: "periodic", 
            ticks: duration,    // Total duration
            interval: 10        // Apply every 10 ticks
        },
    };
}

// In effectSystem.ts
function applyEffect(entity: Entity, effect: Effect): void {
    switch (effect.id) {
        case poisonEffectId: {
            const healthComponent = entity.getEcsComponent(HealthComponentId);
            if (healthComponent) {
                const data = effect.data as { damage: number };
                damage(healthComponent, data.damage);
                entity.invalidateComponent(HealthComponentId);
            }
            break;
        }
    }
}
```

## Future Improvements

- **Effect stacking rules**: Define how multiple instances of the same effect interact
- **Effect visualization**: Enhanced UI to show active effects with timers
- **Effect cancellation**: Allow removing effects before they expire (dispel mechanics)
- **Buff/Debuff system**: Extend to support stat modifications
- **Area of effect**: Apply effects to multiple entities
- **Effect resistance**: Entity stats that reduce effect potency or duration
