import assert from "node:assert";
import { describe, it } from "node:test";
import { resolveStockSources } from "../../../src/game/building/resolveStockSources.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";

function stockpileEntity(id: string): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(
        createInventoryComponent([{ item: woodResourceItem, amount: 5 }]),
    );
    entity.setEcsComponent(createStockpileComponent());
    return entity;
}

function settlement(id: string): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createPlayerKingdomComponent());
    return entity;
}

describe("resolveStockSources", () => {
    it("allStockpiles returns only stockpiles in the anchor's settlement", () => {
        const root = new Entity("root");

        const kingdomA = settlement("kingdomA");
        const stockA1 = stockpileEntity("stockA1");
        const stockA2 = stockpileEntity("stockA2");
        // A crafting building has an inventory but no StockpileComponent — it
        // must not be treated as shared stock.
        const craftingA = new Entity("craftingA");
        craftingA.setEcsComponent(
            createInventoryComponent([{ item: woodResourceItem, amount: 99 }]),
        );

        const kingdomB = settlement("kingdomB");
        const stockB1 = stockpileEntity("stockB1");

        root.addChild(kingdomA);
        root.addChild(kingdomB);
        kingdomA.addChild(stockA1);
        kingdomA.addChild(stockA2);
        kingdomA.addChild(craftingA);
        kingdomB.addChild(stockB1);

        const sources = resolveStockSources({ kind: "allStockpiles" }, stockA1);

        assert.deepStrictEqual(sources.map((s) => s.id).sort(), [
            "stockA1",
            "stockA2",
        ]);
    });

    it("single returns just the named entity when it has an inventory", () => {
        const root = new Entity("root");
        const kingdom = settlement("kingdom");
        const stock = stockpileEntity("stock");
        const noInventory = new Entity("noInventory");

        root.addChild(kingdom);
        kingdom.addChild(stock);
        kingdom.addChild(noInventory);

        assert.deepStrictEqual(
            resolveStockSources(
                { kind: "single", entityId: "stock" },
                stock,
            ).map((s) => s.id),
            ["stock"],
        );
        assert.deepStrictEqual(
            resolveStockSources(
                { kind: "single", entityId: "noInventory" },
                stock,
            ),
            [],
        );
    });
});
