import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
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
    AttackCommandId,
    type AttackCommand,
} from "../../../src/server/message/command/attackTargetCommand.ts";
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
} from "../../../src/game/behavior/components/BehaviorAgentComponent.ts";
import {
    createEffectEmitterComponent,
    EffectEmitterComponentId,
} from "../../../src/game/component/effectEmitterComponent.ts";
import { CollectItemJob } from "../../../src/game/job/collectItemJob.ts";
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

function createTestGameTime(): GameTime {
    return new GameTime();
}

function createTestPersistenceManager(): PersistenceManager {
    return new PersistenceManager(new TestAdapter());
}

describe("commandSystem", () => {
    describe("QueueJobCommand", () => {
        it("adds job to JobQueueComponent", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

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

            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 1);
            assert.strictEqual(updatedJobQueue.jobs[0].id, "collectItem");
        });

        it("sets job state to pending", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

            const system = createCommandSystem(gameTime, persistenceManager);

            const job = CollectItemJob(new Entity("target"));
            job.state = "claimed"; // Set to non-pending state

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: QueueJobCommandId,
                    job,
                } as QueueJobCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs[0].state, "pending");
        });
    });

    describe("EquipItemCommand", () => {
        it("equips item from inventory to slot", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const entity = new Entity("entity1");
            const inventory = createInventoryComponent();
            addInventoryItem(inventory, swordItem, 1);
            entity.setEcsComponent(inventory);

            const equipment = createEquipmentComponent();
            entity.setEcsComponent(equipment);
            root.addChild(entity);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    itemId: swordItem.id,
                    slot: "main",
                    entity: "entity1",
                } as EquipItemCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedEquipment = entity.getEcsComponent(EquipmentComponentId);
            assert.ok(updatedEquipment);
            assert.strictEqual(updatedEquipment.slots.main?.id, swordItem.id);

            const updatedInventory = entity.getEcsComponent(InventoryComponentId);
            assert.ok(updatedInventory);
            assert.strictEqual(updatedInventory.items.length, 0);
        });

        it("unequips item from slot to inventory", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const entity = new Entity("entity1");
            const inventory = createInventoryComponent();
            entity.setEcsComponent(inventory);

            const equipment = createEquipmentComponent();
            equipment.slots.main = swordItem;
            entity.setEcsComponent(equipment);
            root.addChild(entity);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    itemId: null,
                    slot: "main",
                    entity: "entity1",
                } as EquipItemCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedEquipment = entity.getEcsComponent(EquipmentComponentId);
            assert.ok(updatedEquipment);
            assert.strictEqual(updatedEquipment.slots.main, null);

            const updatedInventory = entity.getEcsComponent(InventoryComponentId);
            assert.ok(updatedInventory);
            assert.strictEqual(updatedInventory.items.length, 1);
            assert.strictEqual(updatedInventory.items[0].item.id, swordItem.id);
        });

        it("handles missing entity gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    itemId: swordItem.id,
                    slot: "main",
                    entity: "nonexistent",
                } as EquipItemCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("handles missing inventory component gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const entity = new Entity("entity1");
            const equipment = createEquipmentComponent();
            entity.setEcsComponent(equipment);
            root.addChild(entity);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    itemId: swordItem.id,
                    slot: "main",
                    entity: "entity1",
                } as EquipItemCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("handles missing equipment component gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const entity = new Entity("entity1");
            const inventory = createInventoryComponent();
            addInventoryItem(inventory, swordItem, 1);
            entity.setEcsComponent(inventory);
            root.addChild(entity);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    itemId: swordItem.id,
                    slot: "main",
                    entity: "entity1",
                } as EquipItemCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);
        });

        it("handles insufficient item quantity gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const entity = new Entity("entity1");
            const inventory = createInventoryComponent(); // Empty inventory
            entity.setEcsComponent(inventory);

            const equipment = createEquipmentComponent();
            entity.setEcsComponent(equipment);
            root.addChild(entity);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: EquipItemCommandId,
                    itemId: swordItem.id,
                    slot: "main",
                    entity: "entity1",
                } as EquipItemCommand,
            };

            // Should not throw
            system.onGameMessage?.(root, message);

            // Equipment should remain empty
            const updatedEquipment = entity.getEcsComponent(EquipmentComponentId);
            assert.ok(updatedEquipment);
            assert.strictEqual(updatedEquipment.slots.main, null);
        });
    });

    describe("AttackCommand", () => {
        it("creates AttackJob in job queue", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: AttackCommandId,
                    attacker: "attacker1",
                    target: "target1",
                } as AttackCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 1);
            assert.strictEqual(updatedJobQueue.jobs[0].id, "attackJob");
        });

        it("sets attacker and target on AttackJob", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

            const system = createCommandSystem(gameTime, persistenceManager);

            const message: CommandGameMessage = {
                type: CommandGameMessageType,
                command: {
                    id: AttackCommandId,
                    attacker: "warrior1",
                    target: "goblin1",
                } as AttackCommand,
            };

            system.onGameMessage?.(root, message);

            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            const job = updatedJobQueue.jobs[0];
            assert.strictEqual((job as any).attacker, "warrior1");
            assert.strictEqual((job as any).target, "goblin1");
        });
    });

    describe("BuildCommand", () => {
        it("creates building entity at position", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

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

            // Should create at least one child entity
            assert.ok(root.children.length >= 1);

            // Should create a BuildBuildingJob
            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 1);
            assert.strictEqual(updatedJobQueue.jobs[0].id, "buildBuildingJob");
        });

        it("creates multiple building entities for array of positions", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

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

            // Should create 3 building entities
            assert.strictEqual(root.children.length, 3);

            // Should create 3 BuildBuildingJobs
            const updatedJobQueue = root.getEcsComponent(JobQueueComponentId);
            assert.ok(updatedJobQueue);
            assert.strictEqual(updatedJobQueue.jobs.length, 3);
        });

        it("handles invalid building ID gracefully", () => {
            const root = new Entity("root");
            const gameTime = createTestGameTime();
            const persistenceManager = createTestPersistenceManager();

            const jobQueue = createJobQueueComponent();
            root.setEcsComponent(jobQueue);

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

            // Should not create any entities
            assert.strictEqual(root.children.length, 0);
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

            const updatedOccupation = worker.getEcsComponent(OccupationComponentId);
            assert.ok(updatedOccupation);
            assert.strictEqual(updatedOccupation.workplace, "workplace1");

            const updatedWorkplace = workplace.getEcsComponent(WorkplaceComponentId);
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

            const updatedOccupation = worker.getEcsComponent(OccupationComponentId);
            assert.ok(updatedOccupation);
            assert.strictEqual(updatedOccupation.workplace, undefined);

            const updatedWorkplace = workplace.getEcsComponent(WorkplaceComponentId);
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

            const updatedAgent = agent.getEcsComponent(BehaviorAgentComponentId);
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
            behaviorAgent.shouldReplan = false;
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

            const updatedAgent = agent.getEcsComponent(BehaviorAgentComponentId);
            assert.ok(updatedAgent);
            assert.strictEqual(updatedAgent.shouldReplan, true);
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
});
