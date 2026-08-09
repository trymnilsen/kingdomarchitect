import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { createInventorySpillSystem } from "../../../src/game/system/inventorySpillSystem.ts";
import { GameTime } from "../../../src/game/gameTime.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { damageEntity } from "../../../src/game/component/healthComponent.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import {
    GroundItemComponentId,
    type GroundItemComponent,
} from "../../../src/game/component/groundItemComponent.ts";
import { MAX_GROUND_ITEMS_PER_TILE } from "../../../src/game/behavior/dropItem.ts";
import { encodePosition } from "../../../src/common/point.ts";
import type { InventoryItem } from "../../../src/data/inventory/inventoryItem.ts";
import {
    berryItem,
    flaxResourceItem,
    ironOreItem,
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

const STORE_POSITION = { x: 12, y: 9 };

function createWorldWithStore(
    stock: InventoryItem[],
    amountEach: number,
    tick: number,
) {
    const gameTime = new GameTime();
    gameTime.setTick(tick);

    const { root, world } = createMinimalWorld({ minChunk: -1, maxChunk: 2 });
    world.addSystem(createInventorySpillSystem(gameTime));

    const store = buildingPrefab(stockPile, false, "store");
    root.addChild(store);
    store.worldPosition = STORE_POSITION;

    const inventory = store.requireEcsComponent(InventoryComponentId);
    for (const item of stock) {
        addInventoryItem(inventory, item, amountEach);
    }

    return { root, store };
}

function groundStacks(root: Entity) {
    const stacks: {
        entity: Entity;
        groundItem: GroundItemComponent;
        itemId: string;
        amount: number;
    }[] = [];
    for (const [entity, groundItem] of root.queryComponents(
        GroundItemComponentId,
    )) {
        const collectable = entity.requireEcsComponent(CollectableComponentId);
        for (const stack of collectable.items) {
            stacks.push({
                entity,
                groundItem,
                itemId: stack.item.id,
                amount: stack.amount,
            });
        }
    }
    return stacks;
}

describe("inventorySpillSystem", () => {
    it("spills every stored stack onto the ground when a store dies", () => {
        const stock = [
            woodResourceItem,
            stoneResource,
            ironOreItem,
            wheatResourceItem,
            flaxResourceItem,
            berryItem,
        ];
        const { root, store } = createWorldWithStore(stock, 6, 400);

        damageEntity(store, 100, 400);

        const stacks = groundStacks(root);
        assert.strictEqual(
            stacks.length,
            stock.length,
            "one ground stack per stored type, nothing destroyed",
        );
        for (const item of stock) {
            const spilled = stacks.find((stack) => stack.itemId === item.id);
            assert.ok(spilled, `${item.id} reached the ground`);
            assert.strictEqual(spilled.amount, 6, `all of the ${item.id}`);
        }
    });

    it("rings the wreck rather than burying the goods under it", () => {
        const stock = [
            woodResourceItem,
            stoneResource,
            ironOreItem,
            wheatResourceItem,
            flaxResourceItem,
            berryItem,
        ];
        const { root, store } = createWorldWithStore(stock, 6, 400);

        damageEntity(store, 100, 400);

        const stacks = groundStacks(root);
        const perTile = new Map<number, number>();
        for (const stack of stacks) {
            const position = stack.entity.worldPosition;
            assert.notDeepStrictEqual(
                position,
                STORE_POSITION,
                "the dying store's own tile still blocks drops",
            );
            const key = encodePosition(position.x, position.y);
            perTile.set(key, (perTile.get(key) ?? 0) + 1);
        }
        for (const count of perTile.values()) {
            assert.ok(
                count <= MAX_GROUND_ITEMS_PER_TILE,
                `no tile exceeds ${MAX_GROUND_ITEMS_PER_TILE} piles, saw ${count}`,
            );
        }
        assert.ok(
            perTile.size > 1,
            "a six-type spill spreads across several tiles",
        );
    });

    it("starts the decay clock at the tick the store died", () => {
        const { root, store } = createWorldWithStore(
            [woodResourceItem],
            5,
            731,
        );

        damageEntity(store, 100, 731);

        const stacks = groundStacks(root);
        assert.strictEqual(stacks.length, 1);
        assert.strictEqual(stacks[0].groundItem.droppedAtTick, 731);
    });

    it("ignores a dying entity with nothing stored", () => {
        const { root, store } = createWorldWithStore([], 0, 10);

        damageEntity(store, 100, 10);

        assert.strictEqual(groundStacks(root).length, 0);
    });
});
