# Forester plant/chop loop

## Context

The forester is currently **plant-only**. Each queued `ProductionJob` plants one tree into a
random empty tile in the building's diamond zone (`forresterProduction`, `zoneRadius: 2`).
Trees spawn instantly choppable (`tree1`, `Finite`, 100 HP), and chopping is a *separate* manual
`CollectResourceJob` the player triggers per-tree. Two telling details: the building's
`maxTreeFraction: 0.8` / `minTreeFraction: 0.4` are **defined but completely unused**, and there
is no link between planting and chopping — so a worker could plant a tree and immediately chop it.

The goal is to give the forester a self-balancing plant→chop loop, mirroring the farm's
plant/harvest rhythm, **without** the farm's per-tile growth/maturity machinery.

### Design decisions (from interview)

- **One generic order, worker auto-decides.** The player keeps queuing the same `ProductionJob`
  ("orders"). When a worker claims an order, the planner decides plant-vs-chop from the current
  tree population. No second button, no explicit chop job.
- **Decision = steady balance toward a target population.**
  - `treeCount < target` and an empty tile exists → **plant**.
  - **once `treeCount` reaches/exceeds `target` → chop a randomly-picked tree** in the zone
    (as long as `treeCount >= floor`, the safety gate).
  - else → no work, fail the order out of the queue.
  - `target` = `maxTreeFraction × plantableTiles`, `floor` = `minTreeFraction × plantableTiles`.
  - So the population climbs to `target`, then each further order chops one **random** tree
    (dropping it to `target-1`), and the next order replants back up — the tree picked to chop is
    always chosen at random from the standing trees, never the one just planted.
- **No maturity/age.** Trees are full-grown on plant. The population must reach `target` before any
  chopping starts, so "plant-then-chop-the-same-tree" can't happen. Pacing comes from the existing
  `plantDuration` (planting) and the chop's per-swing HP work — not from a growth timer.
- **Chop target = random** qualifying tree in the zone.
- **Chopped tree is removed (not auto-replanted).** Replanting only happens when a *later* order
  finds `treeCount < target`. Plant and chop stay independent orders.

This reuses everything that already exists: the `ProductionJob` queue, the `plantTree` action, the
`harvestResource` chop action, the diamond utilities, and the unused fraction constants.

## Implementation

### 1. Tree-counting / random-tree zone helpers — `ts/src/game/map/item/placement.ts`
Add a helper alongside `findRandomSpawnInDiamond` that returns the resource entities of a given
`resourceId` inside the diamond (excluding center). Used both to count and to pick a random tree:

```ts
export function getResourcesInDiamond(
    center: Point, radius: number, chunkMap: ChunkMap, resourceId: string,
): Entity[]
```
Implementation mirrors `findRandomSpawnInDiamond`: query `getEntitiesInChunkMapWithin(bounds)`,
keep entities inside the diamond (`|dx|+|dy| <= radius`, skip center) whose
`ResourceComponentId` component has `resourceId === resourceId`. (Imports: `Entity`,
`ResourceComponentId` from `ts/src/game/component/resourceComponent.ts`.)

### 2. Plant-vs-chop decision — `ts/src/game/job/planner/productionPlanner.ts`
Replace the zone branch (currently always plants; lines ~64–99) with the decision logic. Keep the
`extract` branch untouched.

- Compute `plantableTiles = getDiamondPoints(center, radius).length - 1` (exclude center).
- `target = Math.round(def.maxTreeFraction * plantableTiles)`,
  `floor = Math.floor(def.minTreeFraction * plantableTiles)`.
- `trees = getResourcesInDiamond(...)`; `treeCount = trees.length`.
- **Plant** when `treeCount < target` and `findRandomSpawnInDiamond(...)` returns a spot →
  `[moveTo(spot, cardinal), plantTree(...)]` (unchanged).
- **Chop** when at/above target (or no empty spot) and `treeCount >= floor` and `trees.length > 0`:
  pick a random tree, return
  `[moveTo(tree.worldPosition, cardinal), { type: "harvestResource", entityId: tree.id, harvestAction: ResourceHarvestMode.Chop }]`.
  Because the chop deposits wood into the held slot, **prepend `planDepositHeld(worker)` when the
  worker's `HeldItemComponent` is non-empty** (same guard `planJob` applies for
  `collectResource`). Do this in the chop branch only so plant orders aren't forced to deposit.
- **No work** (can't plant, can't chop) → `failJobFromQueue` + return `[]` (existing pattern).

New imports here: `getResourcesInDiamond`, `getDiamondPoints`, `ResourceHarvestMode`
(from `ts/src/data/inventory/items/naturalResource.ts`), `planDepositHeld`,
`HeldItemComponentId` + `isHeldEmpty`.

### 3. Let the chop action complete a production order — `ts/src/game/behavior/actions/harvestResourceAction.ts`
`executeChopHarvest` only completes the claimed job when `job.id === "collectResource"`
(line ~201). Relax it to also accept `"productionJob"`:
```ts
if (job && (job.id === "collectResource" || job.id === "productionJob")) { ... }
```
Apply the same change in `executeWorkHarvest` (line ~235) for consistency.

### 4. Button label — `ts/src/data/production/productionDefinition.ts`
Rename `forresterProduction.actionName` from `"Plant Tree"` to **`"Tend Forest"`** (the order now
plants *or* chops). `maxTreeFraction` / `minTreeFraction` keep their names but are now live — add a
short comment noting `max` = target population, `min` = chop floor. No type changes.

### 5. UI — no structural change needed
`ProductionBuildingSelectionProvider` already queues one order per click, shows `actionName (N)`,
and offers **Clear Queue**; "Prioritise job" already works via its own provider. The label updates
automatically from step 4. *(Optional polish, not required: a "+5" batch button, or showing
`treeCount/target` for feedback.)*

## Tuning (easy to change later)
- Zone radius 2 → 13 diamond tiles, 12 plantable. Defaults give `target ≈ 10`, `floor ≈ 5`.
- `tree1` is 100 HP / 10 dmg per swing = ~10 ticks per chop; `plantDuration: 3`. If chopping feels
  too slow or wood yield (100) too high for a steady loop, tune tree HP / yield / fractions.

## Verification
1. `npm run build` (and `npm run test` if forester/production specs exist) — confirm with the user
   first per project rule.
2. In-app: place a forester, queue several "Tend Forest" orders. Expect workers to **plant** until
   the zone reaches ~target trees, then start **chopping** random trees for wood, replanting on
   later orders as the count dips below target — never chopping a just-planted sapling while the
   forest is still filling. Confirm chopped trees disappear and wood is delivered to storage, and
   that a worker holding wood deposits it before chopping.
3. Edge checks: queueing orders on a full zone chops down toward target; "Clear Queue" cancels
   unclaimed orders; "Prioritise job" still bumps a forester order.
