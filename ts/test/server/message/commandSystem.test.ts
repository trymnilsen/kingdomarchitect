import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import { createCommandSystem } from "../../../src/game/system/commandSystem.ts";
import { GameTime } from "../../../src/game/gameTime.ts";
import { PersistenceManager } from "../../../src/server/persistence/persistenceManager.ts";
import { TestAdapter } from "../persistence/testAdapter.ts";
import {
    CommandGameMessageType,
    type CommandGameMessage,
} from "../../../src/server/message/gameMessage.ts";
import {
    QueueJobCommandId,
    type QueueJobCommand,
} from "../../../src/server/message/command/queueJobCommand.ts";
import {
    EquipItemCommandId,
    type EquipItemCommand,
} from "../../../src/server/message/command/equipItemCommand.ts";
import {
    BuildCommandId,
    type BuildCommand,
} from "../../../src/server/message/command/buildCommand.ts";
import {
    ChangeOccupationCommandId,
    type ChangeOccupationCommand,
} from "../../../src/server/message/command/changeOccupationCommand.ts";
import {
    SetPlayerCommandId,
    type SetPlayerCommand,
} from "../../../src/server/message/command/setPlayerCommand.ts";
import {
    addJob,
    createJobQueueComponent,
    JobQueueComponentId,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
    addInventoryItem,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createEquipmentComponent,
    EquipmentComponentId,
} from "../../../src/game/component/equipmentComponent.ts";
import {
    createOccupationComponent,
    OccupationComponentId,
} from "../../../src/game/component/occupationComponent.ts";
import {
    createWorkplaceComponent,
    WorkplaceComponentId,
} from "../../../src/game/component/workplaceComponent.ts";
import {
    createBehaviorAgentComponent,
    BehaviorAgentComponentId,
} from "../../../src/game/component/BehaviorAgentComponent.ts";

import { CollectItemJob } from "../../../src/game/job/collectItemJob.ts";
import { isTargetOfJob } from "../../../src/game/job/job.ts";
import {
    PrioritiseJobCommandId,
    type PrioritiseJobCommand,
} from "../../../src/server/message/command/prioritiseJobCommand.ts";
import { swordItem } from "../../../src/data/inventory/items/equipment.ts";
import {
    UpdateWorkerRoleCommandId,
    type UpdateWorkerRoleCommand,
} from "../../../src/server/message/command/updateWorkerRoleCommand.ts";
import {
    UpdateWorkerStanceCommandId,
    type UpdateWorkerStanceCommand,
} from "../../../src/server/message/command/updateWorkerStanceCommand.ts";
import {
    createRoleComponent,
    RoleComponentId,
    WorkerRole,
    WorkerStance,
} from "../../../src/game/component/worker/roleComponent.ts";
import { playerKingdomPrefab } from "../../../src/game/prefab/playerKingdomPrefab.ts";
import {
    SetFarmCropCommandId,
    type SetFarmCropCommand,
} from "../../../src/server/message/command/setFarmCropCommand.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../src/game/component/farmComponent.ts";

function createTestGameTime(): GameTime {
    return new GameTime();
}

function createTestPersistenceManager(): PersistenceManager {
    return new PersistenceManager(new TestAdapter());
}

/**
 * Creates a root entity with a player kingdom entity already set up,
 * matching the runtime structure expected by commandSystem.
 */
function createRootWithKingdom(): { root: Entity; playerKingdom: Entity } {
    const root = new Entity("root");
    root.setEcsComponent(createChunkMapComponent());
    const playerKingdom = playerKingdomPrefab();
    root.addChild(playerKingdom);
    return { root, playerKingdom };
}

describe("commandSystem", () => {
    describe("QueueJobCommand", () => {
        it("adds job to JobQueueComponent", () => {
            const { root, playerKingdom } = createRootWithKingdom();
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const job = CollectItemJob(new Entity("target"));
            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: QueueJobCommandId,
                    job,
                } as QueueJobCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedJobQueue =
                playerKingdom.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 1);
            assert.strictEqual(updatedJobQueue.jobs[0].id, "collectItem");
        });
    });

    describe("PrioritiseJobCommand", () => {
        /**
         * Seeds the player kingdom's queue with two collect jobs targeting two
         * child entities, ordered so entityA's job is first and entityB's last.
         */
        function setupQueueWithTwoTargets(): {
            root: Entity;
            playerKingdom: Entity;
            entityA: Entity;
            entityB: Entity;
            system: ReturnType<typeof createCommandSystem>;
        } {
            const { root, playerKingdom } = createRootWithKingdom();

            const entityA = new Entity("entityA");
            const entityB = new Entity("entityB");
            playerKingdom.addChild(entityA);
            playerKingdom.addChild(entityB);

            const queue =
                playerKingdom.requireEcsComponent(JobQueueComponentId);
            addJob(queue, CollectItemJob(entityA));
            addJob(queue, CollectItemJob(entityB));

            const system = createCommandSystem(
                createTestGameTime(),
                createTestPersistenceManager(),
            );

            return { root, playerKingdom, entityA, entityB, system };
        }

        it("moves the target entity's job to the front of the queue", () => {
            const { root, playerKingdom, entityA, entityB, system } =
                setupQueueWithTwoTargets();

            // Pre-state: entityA's job leads, entityB's trails.
            const before =
                playerKingdom.requireEcsComponent(JobQueueComponentId);
            assert.ok(isTargetOfJob(before.jobs[0], entityA));
            assert.ok(isTargetOfJob(before.jobs[1], entityB));

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: PrioritiseJobCommandId,
                    entityId: "entityB",
                } as PrioritiseJobCommand,
            };

            system.onGameMessage?.(root, message);

            // entityB's job is now first; nothing was added or removed.
            const after =
                playerKingdom.requireEcsComponent(JobQueueComponentId);
            assert.strictEqual(after.jobs.length, 2);
            assert.ok(
                isTargetOfJob(after.jobs[0], entityB),
                "entityB's job should be at the front of the queue",
            );
            assert.ok(isTargetOfJob(after.jobs[1], entityA));
        });

        it("leaves the queue unchanged when no job targets the entity", () => {
            const { root, playerKingdom, system } = setupQueueWithTwoTargets();

            const entityC = new Entity("entityC");
            playerKingdom.addChild(entityC);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: PrioritiseJobCommandId,
                    entityId: "entityC",
                } as PrioritiseJobCommand,
            };

            system.onGameMessage?.(root, message);

            const after =
                playerKingdom.requireEcsComponent(JobQueueComponentId);
            assert.strictEqual(after.jobs.length, 2);
            assert.strictEqual(after.jobs[0].id, "collectItem");
            assert.strictEqual(
                (after.jobs[0] as CollectItemJob).entityId,
                "entityA",
            );
        });

        it("is a no-op when the target's job is already first", () => {
            const { root, playerKingdom, entityA, system } =
                setupQueueWithTwoTargets();

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: PrioritiseJobCommandId,
                    entityId: "entityA",
                } as PrioritiseJobCommand,
            };

            system.onGameMessage?.(root, message);

            const after =
                playerKingdom.requireEcsComponent(JobQueueComponentId);
            assert.strictEqual(after.jobs.length, 2);
            assert.ok(isTargetOfJob(after.jobs[0], entityA));
        });
    });

    describe("EquipItemCommand", () => {
        it("routes equip into the worker's player command", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const entity = new Entity("entity1");
            entity.setEcsComponent(createEquipmentComponent());
            entity.setEcsComponent(createBehaviorAgentComponent());
            root.addChild(entity);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    entity: "entity1",
                    sourceEntityId: "stockpile-1",
                    itemId: swordItem.id,
                    slot: "primary",
                } as EquipItemCommand,
            };

            system.onGameMessage?.(root, message);

            const agent = entity.getEcsComponent(BehaviorAgentComponentId);
            assert.ok(agent);
            assert.deepStrictEqual(agent.playerCommand, {
                action: "equip",
                sourceEntityId: "stockpile-1",
                itemId: swordItem.id,
                slot: "primary",
            });
        });

        it("does nothing when entity is missing", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    entity: "nonexistent",
                    sourceEntityId: "stockpile-1",
                    itemId: swordItem.id,
                    slot: "primary",
                } as EquipItemCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });
    });

    describe("BuildCommand", () => {
        it("creates building entity at position", () => {
            const { root, playerKingdom } = createRootWithKingdom();
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: BuildCommandId,
                    buildingId: "stockpile",
                    position: { x: 100, y: 200 },
                } as BuildCommand,
            };

            system.onGameMessage?.(root, message);

            // Building is created under the player kingdom entity
            assert.ok(playerKingdom.children.length >= 1);

            // Should create a BuildBuildingJob in the player kingdom's queue
            const updatedJobQueue =
                playerKingdom.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 1);
            assert.strictEqual(updatedJobQueue.jobs[0].id, "buildBuildingJob");
        });

        it("creates multiple building entities for array of positions", () => {
            const { root, playerKingdom } = createRootWithKingdom();
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: BuildCommandId,
                    buildingId: "stockpile",
                    position: [
                        { x: 100, y: 200 },
                        { x: 150, y: 200 },
                        { x: 200, y: 200 },
                    ],
                } as BuildCommand,
            };

            system.onGameMessage?.(root, message);

            // 3 building entities should be under the player kingdom
            assert.strictEqual(playerKingdom.children.length, 3);

            // Should create 3 BuildBuildingJobs in the player kingdom's queue
            const updatedJobQueue =
                playerKingdom.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 3);
        });

        it("handles invalid building ID gracefully", () => {
            const { root, playerKingdom } = createRootWithKingdom();
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: BuildCommandId,
                    buildingId: "nonexistent_building",
                    position: { x: 100, y: 200 },
                } as BuildCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);

            // Should not create any child entities on the player kingdom
            assert.strictEqual(playerKingdom.children.length, 0);
        });
    });

    describe("ChangeOccupationCommand", () => {
        it("assigns worker to workplace", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const occupation = createOccupationComponent();
            worker.setEcsComponent(occupation);
            root.addChild(worker);

            const workplace = new Entity("workplace1");
            const workplaceComponent = createWorkplaceComponent();
            workplace.setEcsComponent(workplaceComponent);
            root.addChild(workplace);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: ChangeOccupationCommandId,
                    worker: "worker1",
                    workplace: "workplace1",
                    action: "assign",
                } as ChangeOccupationCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedOccupation = worker.getEcsComponent(
                OccupationComponentId,
            );
            assert.ok(updatedOccupation);
            assert.strictEqual(updatedOccupation.workplace, "workplace1");

            const updatedWorkplace =
                workplace.getEcsComponent(WorkplaceComponentId);
            assert.ok(updatedWorkplace);
            assert.ok(updatedWorkplace.workers.includes("worker1"));
        });

        it("unassigns worker from workplace", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const occupation = createOccupationComponent();
            occupation.workplace = "workplace1";
            worker.setEcsComponent(occupation);
            root.addChild(worker);

            const workplace = new Entity("workplace1");
            const workplaceComponent = createWorkplaceComponent();
            workplaceComponent.workers.push("worker1");
            workplace.setEcsComponent(workplaceComponent);
            root.addChild(workplace);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: ChangeOccupationCommandId,
                    worker: "worker1",
                    workplace: "workplace1",
                    action: "unassign",
                } as ChangeOccupationCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedOccupation = worker.getEcsComponent(
                OccupationComponentId,
            );
            assert.ok(updatedOccupation);
            assert.strictEqual(updatedOccupation.workplace, undefined);

            const updatedWorkplace =
                workplace.getEcsComponent(WorkplaceComponentId);
            assert.ok(updatedWorkplace);
            assert.ok(!updatedWorkplace.workers.includes("worker1"));
        });

        it("throws when worker not found", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const workplace = new Entity("workplace1");
            const workplaceComponent = createWorkplaceComponent();
            workplace.setEcsComponent(workplaceComponent);
            root.addChild(workplace);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: ChangeOccupationCommandId,
                    worker: "nonexistent",
                    workplace: "workplace1",
                    action: "assign",
                } as ChangeOccupationCommand,
            };

            assert.throws(() => {
                system.onGameMessage?.(root, message);
            });
        });

        it("throws when workplace not found", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const occupation = createOccupationComponent();
            worker.setEcsComponent(occupation);
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: ChangeOccupationCommandId,
                    worker: "worker1",
                    workplace: "nonexistent",
                    action: "assign",
                } as ChangeOccupationCommand,
            };

            assert.throws(() => {
                system.onGameMessage?.(root, message);
            });
        });
    });

    describe("SetPlayerCommand", () => {
        it("sets player command on BehaviorAgentComponent", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const agent = new Entity("agent1");
            const behaviorAgent = createBehaviorAgentComponent();
            agent.setEcsComponent(behaviorAgent);
            root.addChild(agent);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetPlayerCommandId,
                    agentId: "agent1",
                    command: {
                        action: "move",
                        targetPosition: { x: 100, y: 200 },
                    },
                } as SetPlayerCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedAgent = agent.getEcsComponent(
                BehaviorAgentComponentId,
            );
            assert.ok(updatedAgent);
            assert.ok(updatedAgent.playerCommand);
            assert.strictEqual(updatedAgent.playerCommand.action, "move");
            assert.deepStrictEqual(
                (updatedAgent.playerCommand as any).targetPosition,
                { x: 100, y: 200 },
            );
        });

        it("triggers replan on agent", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const agent = new Entity("agent1");
            const behaviorAgent = createBehaviorAgentComponent();
            behaviorAgent.pendingReplan = undefined;
            agent.setEcsComponent(behaviorAgent);
            root.addChild(agent);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetPlayerCommandId,
                    agentId: "agent1",
                    command: {
                        action: "attack",
                        targetEntityId: "enemy1",
                    },
                } as SetPlayerCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedAgent = agent.getEcsComponent(
                BehaviorAgentComponentId,
            );
            assert.ok(updatedAgent);
            assert.deepStrictEqual(updatedAgent.pendingReplan, {
                kind: "replan",
            });
        });

        it("handles missing agent gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetPlayerCommandId,
                    agentId: "nonexistent",
                    command: {
                        action: "move",
                        targetPosition: { x: 100, y: 200 },
                    },
                } as SetPlayerCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("handles missing BehaviorAgentComponent gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const agent = new Entity("agent1");
            // No BehaviorAgentComponent
            root.addChild(agent);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetPlayerCommandId,
                    agentId: "agent1",
                    command: {
                        action: "move",
                        targetPosition: { x: 100, y: 200 },
                    },
                } as SetPlayerCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });
    });

    describe("message filtering", () => {
        it("ignores non-command messages", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

            const system = createCommandSystem(gameTime, persistenceManager);

            // Send a non-command message
            const message = {
                type: "worldState",
                rootChildren: [],
                discoveredTiles: [],
                volumes: [],
            };

            system.onGameMessage?.(root, message as any);

            // JobQueue should be unaffected
            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 0);
        });
    });

    describe("UpdateWorkerRoleCommand", () => {
        it("updates worker role", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const roleComponent = createRoleComponent();
            worker.setEcsComponent(roleComponent);
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerRoleCommandId,
                    worker: "worker1",
                    role: WorkerRole.Guard,
                } as UpdateWorkerRoleCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedRole = worker.getEcsComponent(RoleComponentId);
            assert.ok(updatedRole);
            assert.strictEqual(updatedRole.role, WorkerRole.Guard);
        });

        it("handles missing worker gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerRoleCommandId,
                    worker: "nonexistent",
                    role: WorkerRole.Guard,
                } as UpdateWorkerRoleCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("handles missing role component gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            // No role component
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerRoleCommandId,
                    worker: "worker1",
                    role: WorkerRole.Guard,
                } as UpdateWorkerRoleCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("updates to all role types correctly", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const roleComponent = createRoleComponent();
            worker.setEcsComponent(roleComponent);
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const roles = [
                WorkerRole.Worker,
                WorkerRole.Explorer,
                WorkerRole.Guard,
                WorkerRole.Devotee,
                WorkerRole.Spy,
                WorkerRole.Envoy,
                WorkerRole.Trader,
            ];

            for (const role of roles) {
                const message: CommandGameMessage = {
                    type: CommandGameMessageType,
                    command: {
                        id: UpdateWorkerRoleCommandId,
                        worker: "worker1",
                        role,
                    } as UpdateWorkerRoleCommand,
                };

                system.onGameMessage?.(root, message);

                const updatedRole = worker.getEcsComponent(RoleComponentId);
                assert.ok(updatedRole);
                assert.strictEqual(updatedRole.role, role);
            }
        });
    });

    describe("UpdateWorkerStanceCommand", () => {
        it("updates worker stance to aggressive", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const roleComponent = createRoleComponent();
            worker.setEcsComponent(roleComponent);
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerStanceCommandId,
                    worker: "worker1",
                    stance: WorkerStance.Aggressive,
                } as UpdateWorkerStanceCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedRole = worker.getEcsComponent(RoleComponentId);
            assert.ok(updatedRole);
            assert.strictEqual(updatedRole.stance, WorkerStance.Aggressive);
        });

        it("updates worker stance to defensive", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            const roleComponent = createRoleComponent();
            roleComponent.stance = WorkerStance.Aggressive; // Start with aggressive
            worker.setEcsComponent(roleComponent);
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerStanceCommandId,
                    worker: "worker1",
                    stance: WorkerStance.Defensive,
                } as UpdateWorkerStanceCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedRole = worker.getEcsComponent(RoleComponentId);
            assert.ok(updatedRole);
            assert.strictEqual(updatedRole.stance, WorkerStance.Defensive);
        });

        it("handles missing worker gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerStanceCommandId,
                    worker: "nonexistent",
                    stance: WorkerStance.Aggressive,
                } as UpdateWorkerStanceCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("handles missing role component gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const worker = new Entity("worker1");
            // No role component
            root.addChild(worker);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: UpdateWorkerStanceCommandId,
                    worker: "worker1",
                    stance: WorkerStance.Aggressive,
                } as UpdateWorkerStanceCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });
    });

    describe("SetFarmCropCommand", () => {
        it("changes the crop of a fallow farm", () => {
            const root = new Entity("root");
            const farm = new Entity("farm1");
            farm.setEcsComponent(createFarmComponent("wheat"));
            root.addChild(farm);

            const system = createCommandSystem(
                createTestGameTime(),
                createTestPersistenceManager(),
            );

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetFarmCropCommandId,
                    building: "farm1",
                    cropId: "flax",
                } as SetFarmCropCommand,
            };

            system.onGameMessage?.(root, message);

            const farmComponent = farm.getEcsComponent(FarmComponentId);
            assert.ok(farmComponent);
            assert.strictEqual(farmComponent.cropId, "flax");
        });

        it("ignores the change while the farm is Growing", () => {
            // A planted crop is committed until harvested, so the crop must not
            // change mid-grow (otherwise the yield would mismatch what was sown).
            const root = new Entity("root");
            const farm = new Entity("farm1");
            const farmComponent = createFarmComponent("wheat");
            farmComponent.state = FarmState.Growing;
            farm.setEcsComponent(farmComponent);
            root.addChild(farm);

            const system = createCommandSystem(
                createTestGameTime(),
                createTestPersistenceManager(),
            );

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetFarmCropCommandId,
                    building: "farm1",
                    cropId: "flax",
                } as SetFarmCropCommand,
            };

            system.onGameMessage?.(root, message);

            assert.strictEqual(
                farm.getEcsComponent(FarmComponentId)?.cropId,
                "wheat",
            );
        });

        it("handles a missing farm component gracefully", () => {
            const root = new Entity("root");
            const building = new Entity("building1");
            // No farm component
            root.addChild(building);

            const system = createCommandSystem(
                createTestGameTime(),
                createTestPersistenceManager(),
            );

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: SetFarmCropCommandId,
                    building: "building1",
                    cropId: "flax",
                } as SetFarmCropCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });
    });
});
