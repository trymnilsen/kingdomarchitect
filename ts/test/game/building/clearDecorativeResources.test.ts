import assert from "node:assert";
import { describe, it } from "node:test";
import {
    grassResource,
    treeResource,
} from "../../../src/data/inventory/items/naturalResource.ts";
import { clearDecorativeResourcesAt } from "../../../src/game/building/clearDecorativeResources.ts";
import { createBehaviorAgentComponent } from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createSpriteComponent } from "../../../src/game/component/spriteComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { resourcePrefab } from "../../../src/game/prefab/resourcePrefab.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { spriteRefs } from "../../../src/asset/sprite.ts";

function addResourceAt(
    root: Entity,
    resource: typeof grassResource | typeof treeResource,
    position: { x: number; y: number },
): Entity {
    const entity = resourcePrefab(resource);
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

describe("clearDecorativeResourcesAt", () => {
    it("removes a decorative resource at the point", () => {
        const { root } = createMinimalWorld();
        const grass = addResourceAt(root, grassResource, { x: 3, y: 3 });

        clearDecorativeResourcesAt(root, { x: 3, y: 3 });

        assert.ok(!root.children.includes(grass), "grass should be removed");
    });

    it("leaves blocking resources untouched", () => {
        const { root } = createMinimalWorld();
        const tree = addResourceAt(root, treeResource, { x: 3, y: 3 });

        clearDecorativeResourcesAt(root, { x: 3, y: 3 });

        assert.ok(root.children.includes(tree), "tree should remain");
    });

    it("leaves decorative resources on other tiles untouched", () => {
        const { root } = createMinimalWorld();
        const grass = addResourceAt(root, grassResource, { x: 4, y: 3 });

        clearDecorativeResourcesAt(root, { x: 3, y: 3 });

        assert.ok(root.children.includes(grass), "adjacent grass should remain");
    });

    it("leaves non-resource entities on the same tile untouched", () => {
        const { root } = createMinimalWorld();
        const grass = addResourceAt(root, grassResource, { x: 3, y: 3 });
        const agent = new Entity("agent");
        agent.setEcsComponent(createBehaviorAgentComponent());
        agent.setEcsComponent(createSpriteComponent(spriteRefs.empty_sprite));
        root.addChild(agent);
        agent.worldPosition = { x: 3, y: 3 };

        clearDecorativeResourcesAt(root, { x: 3, y: 3 });

        assert.ok(!root.children.includes(grass), "grass should be removed");
        assert.ok(root.children.includes(agent), "agent should remain");
    });
});
