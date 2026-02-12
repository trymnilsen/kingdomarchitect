# Goblin Behavior System Architecture

## Overview

This document describes the architecture for implementing goblin behaviors and the jobs-to-actions refactor.

## System Architecture

### Current vs New Action Flow

```mermaid
flowchart TB
    subgraph Current["Current Flow (Being Replaced)"]
        direction TB
        J1[Job Queued] --> PJB1[PerformJobBehavior]
        PJB1 --> CA[claimJob Action]
        CA --> EA[executeJob Action]
        EA --> JH[Job Handler runs each tick]
        JH --> |"state machine"| JH
    end

    subgraph New["New Flow"]
        direction TB
        J2[Job Queued] --> PJB2[PerformJobBehavior.expand]
        PJB2 --> |"claims job"| AS[Action Sequence]
        AS --> AE[Actions Execute]
        AE --> |"queue empty"| RP[Replan]
        RP --> PJB2
    end
```

### Behavior System Loop

```mermaid
flowchart TD
    Start([Tick]) --> Check{Action Queue Empty?}
    Check --> |No| Execute[Execute First Action]
    Execute --> Status{Action Status?}
    Status --> |complete| Remove[Remove from Queue]
    Status --> |running| Next([Next Tick])
    Status --> |failed| Clear[Clear Queue + Replan]
    Remove --> Check
    Check --> |Yes| Replan[Call replan]
    Replan --> Evaluate[Evaluate All Behaviors]
    Evaluate --> Select[Select Highest Utility]
    Select --> Expand[Call behavior.expand]
    Expand --> Queue[Queue Actions]
    Queue --> Next
    Clear --> Next
```

## Goblin Behavior Decision Tree

### KeepWarmBehavior expand() Logic

```mermaid
flowchart TD
    Start([expand called]) --> FireCheck{Fire exists?}

    FireCheck --> |Yes| AdjFire{Adjacent to fire?}
    AdjFire --> |No| MoveToFire[/"moveTo fire"/]
    AdjFire --> |Yes| WarmByFire[/"warmByFire"/]

    FireCheck --> |No| WoodCheck{Carrying wood?}
    WoodCheck --> |Yes| AdjPile1{Adjacent to pile?}
    AdjPile1 --> |No| MoveToPile1[/"moveTo pile"/]
    AdjPile1 --> |Yes| Deposit[/"depositToInventory pile"/]

    WoodCheck --> |No| PileCheck{Pile has 10+ wood?}
    PileCheck --> |Yes| SiteCheck{Campfire site exists?}

    SiteCheck --> |No| Place[/"placeBuilding campfire"/]

    SiteCheck --> |Yes| MatCheck{Site needs materials?}
    MatCheck --> |Yes| HaveWood{Have wood in inventory?}
    HaveWood --> |No| AdjPile2{Adjacent to pile?}
    AdjPile2 --> |No| MoveToPile2[/"moveTo pile"/]
    AdjPile2 --> |Yes| Take[/"takeFromInventory pile"/]

    HaveWood --> |Yes| AdjSite1{Adjacent to site?}
    AdjSite1 --> |No| MoveToSite1[/"moveTo site"/]
    AdjSite1 --> |Yes| DepositSite[/"depositToInventory site"/]

    MatCheck --> |No| AdjSite2{Adjacent to site?}
    AdjSite2 --> |No| MoveToSite2[/"moveTo site"/]
    AdjSite2 --> |Yes| Construct[/"constructBuilding"/]

    PileCheck --> |No| TreeCheck{Tree nearby?}
    TreeCheck --> |Yes| AdjTree{Adjacent to tree?}
    AdjTree --> |No| MoveToTree[/"moveTo tree"/]
    AdjTree --> |Yes| Harvest[/"harvestResource tree"/]

    TreeCheck --> |No| Empty[/"return empty"/]
```

### Goblin Camp Progression

```mermaid
stateDiagram-v2
    [*] --> Spawned: Goblin spawns alone

    Spawned --> GatheringWood: Warmth decays
    GatheringWood --> Depositing: Inventory has wood
    Depositing --> GatheringWood: Pile < 10 wood
    Depositing --> PlacingFire: Pile >= 10 wood

    PlacingFire --> FetchingMaterials: Site placed
    FetchingMaterials --> DepositingMaterials: Have materials
    DepositingMaterials --> Constructing: Materials deposited
    Constructing --> WarmingUp: Fire complete

    WarmingUp --> Expanding: Warmth restored
    Expanding --> GatheringWood: Need more wood
    Expanding --> BuildingHut: Pile >= 15 wood

    BuildingHut --> NewGoblin: Hut complete
    NewGoblin --> Expanding: Population < target
    NewGoblin --> [*]: Population = target
```

## Component Relationships

### Entity Component Diagram

```mermaid
erDiagram
    GoblinEntity ||--o| BehaviorAgentComponent : has
    GoblinEntity ||--o| EnergyComponent : has
    GoblinEntity ||--o| WarmthComponent : has
    GoblinEntity ||--o| GoblinUnitComponent : has
    GoblinEntity ||--o| InventoryComponent : has
    GoblinEntity ||--o| HealthComponent : has
    GoblinEntity ||--o| SpriteComponent : has

    CampEntity ||--o| GoblinCampComponent : has

    PileEntity ||--o| InventoryComponent : has
    PileEntity ||--o| SpriteComponent : has

    CampfireEntity ||--o| BuildingComponent : has
    CampfireEntity ||--o| FireSourceComponent : has
    CampfireEntity ||--o| HealthComponent : has
    CampfireEntity ||--o| InventoryComponent : has

    GoblinUnitComponent }o--|| CampEntity : references
```

### Component Data

```mermaid
classDiagram
    class WarmthComponent {
        +id: "Warmth"
        +warmth: number
        +warmthDecayRate: number
        +restoreRate: number
    }

    class GoblinCampComponent {
        +id: "GoblinCamp"
        +targetPopulation: number
        +campPosition: Point
    }

    class GoblinUnitComponent {
        +id: "GoblinUnit"
        +campEntityId: string
    }

    class FireSourceComponent {
        +id: "FireSource"
        +warmthRadius: number
        +warmthStrength: number
    }

    class BehaviorAgentComponent {
        +id: "behavioragent"
        +currentBehaviorName: string
        +actionQueue: BehaviorActionData[]
        +shouldReplan: boolean
    }
```

## Action Types

### Action Data Union

```mermaid
classDiagram
    class BehaviorActionData {
        <<union>>
    }

    class WaitAction {
        +type: "wait"
        +until: number
    }

    class MoveToAction {
        +type: "moveTo"
        +target: Point
    }

    class SleepAction {
        +type: "sleep"
    }

    class HarvestResourceAction {
        +type: "harvestResource"
        +targetEntityId: string
        +harvestMode: ResourceHarvestMode
        +workProgress: number
    }

    class ConstructBuildingAction {
        +type: "constructBuilding"
        +buildingEntityId: string
    }

    class TakeFromInventoryAction {
        +type: "takeFromInventory"
        +sourceEntityId: string
        +items: ItemRequest[]
    }

    class DepositToInventoryAction {
        +type: "depositToInventory"
        +targetEntityId: string
        +items: ItemRequest[]
    }

    class WarmByFireAction {
        +type: "warmByFire"
        +fireEntityId: string
    }

    class PlaceBuildingAction {
        +type: "placeBuilding"
        +buildingId: string
        +position: Point
    }

    BehaviorActionData <|-- WaitAction
    BehaviorActionData <|-- MoveToAction
    BehaviorActionData <|-- SleepAction
    BehaviorActionData <|-- HarvestResourceAction
    BehaviorActionData <|-- ConstructBuildingAction
    BehaviorActionData <|-- TakeFromInventoryAction
    BehaviorActionData <|-- DepositToInventoryAction
    BehaviorActionData <|-- WarmByFireAction
    BehaviorActionData <|-- PlaceBuildingAction
```

## PerformJobBehavior Refactor

### Job Expansion Flow

```mermaid
flowchart TD
    subgraph PerformJobBehavior
        IV[isValid] --> |"has claimed job OR unclaimed jobs exist"| UT[utility: 50]
        UT --> EX[expand]
    end

    subgraph expand
        EX --> HasJob{Has claimed job?}
        HasJob --> |No| Claim[Claim best job]
        Claim --> Expand
        HasJob --> |Yes| Expand[expandJobToActions]
    end

    subgraph expandJobToActions
        Expand --> Switch{job.id}
        Switch --> |collectResource| ECR[expandCollectResource]
        Switch --> |buildBuildingJob| EBB[expandBuildBuilding]
        Switch --> |other| EOther[...]
    end

    subgraph expandCollectResource
        ECR --> ResExists{Resource exists?}
        ResExists --> |No| Complete[completeJob, return empty]
        ResExists --> |Yes| AdjRes{Adjacent?}
        AdjRes --> |No| MoveRes[/"moveTo resource"/]
        AdjRes --> |Yes| Harvest[/"harvestResource"/]
    end

    subgraph expandBuildBuilding
        EBB --> Evaluate[Evaluate current state]
        Evaluate --> NeedMat{Need materials?}
        NeedMat --> |Yes| HaveMat{Have materials?}
        HaveMat --> |No| FetchActions[/"moveTo stockpile, take"/]
        HaveMat --> |Yes| DepActions[/"moveTo building, deposit"/]
        NeedMat --> |No| BuildActions[/"moveTo building, construct"/]
    end
```

## System Integration

### System Registration

```mermaid
flowchart LR
    subgraph GameServer
        direction TB
        BS[BehaviorSystem]
        WS[WarmthSystem]
        GSS[GoblinSpawnSystem]
    end

    subgraph Behaviors["Registered Behaviors"]
        direction TB
        PPB[PerformPlayerCommandBehavior]
        SB[SleepBehavior]
        PJB[PerformJobBehavior]
        HB[HaulBehavior]
        KWB[KeepWarmBehavior]
        ECB[ExpandCampBehavior]
    end

    BS --> Behaviors

    subgraph Entities
        Workers[Player Workers]
        Goblins[Goblins]
    end

    Workers --> |"filtered by PlayerUnitComponent"| PPB
    Workers --> |"filtered by PlayerUnitComponent"| PJB
    Goblins --> |"filtered by GoblinUnitComponent"| KWB
    Goblins --> |"filtered by GoblinUnitComponent"| ECB

    WS --> |"queries WarmthComponent"| Goblins
    GSS --> |"queries GoblinCampComponent"| Camps[Camp Entities]
```

## File Structure

```mermaid
flowchart TD
    subgraph Components["ts/src/game/component/"]
        WC[warmthComponent.ts]
        GCC[goblinCampComponent.ts]
        GUC[goblinUnitComponent.ts]
        FSC[fireSourceComponent.ts]
    end

    subgraph Actions["ts/src/game/behavior/actions/"]
        HRA[harvestResourceAction.ts]
        CBA[constructBuildingAction.ts]
        TFI[takeFromInventoryAction.ts]
        DTI[depositToInventoryAction.ts]
        WBF[warmByFireAction.ts]
        PBA[placeBuildingAction.ts]
    end

    subgraph Behaviors["ts/src/game/behavior/behaviors/goblin/"]
        KW[keepWarmBehavior.ts]
        EC[expandCampBehavior.ts]
    end

    subgraph Systems["ts/src/game/system/"]
        WSys[warmthSystem.ts]
        GSSys[goblinSpawnSystem.ts]
    end

    subgraph Modified["Modified Files"]
        Act[Action.ts]
        AE[ActionExecutor.ts]
        PJB2[PerformJobBehavior.ts]
        GP[goblinPrefab.ts]
        Set[settlement.ts]
        GS[gameServer.ts]
    end
```

## Implementation Phases

```mermaid
gantt
    title Implementation Order
    dateFormat X
    axisFormat %s

    section Phase 1: Actions
    Add action types to Action.ts           :a1, 0, 1
    harvestResourceAction.ts                :a2, 1, 2
    constructBuildingAction.ts              :a3, 2, 3
    takeFromInventoryAction.ts              :a4, 3, 4
    depositToInventoryAction.ts             :a5, 4, 5
    placeBuildingAction.ts                  :a6, 5, 6
    Update ActionExecutor.ts                :a7, 6, 7

    section Phase 2: Job Refactor
    Refactor PerformJobBehavior             :b1, 7, 9
    Update BehaviorSystem cleanup           :b2, 9, 10
    Remove claimJob/executeJob              :b3, 10, 11
    Test player workers                     :b4, 11, 12

    section Phase 3: Components
    warmthComponent.ts                      :c1, 12, 13
    goblinCampComponent.ts                  :c2, 13, 14
    goblinUnitComponent.ts                  :c3, 14, 15
    fireSourceComponent.ts                  :c4, 15, 16
    pilePrefab.ts                           :c5, 16, 17

    section Phase 4: Behaviors
    warmByFireAction.ts                     :d1, 17, 18
    keepWarmBehavior.ts                     :d2, 18, 20
    expandCampBehavior.ts                   :d3, 20, 22

    section Phase 5: Systems
    warmthSystem.ts                         :e1, 22, 23
    goblinSpawnSystem.ts                    :e2, 23, 24

    section Phase 6: Integration
    Update goblinPrefab.ts                  :f1, 24, 25
    Update settlement.ts                    :f2, 25, 26
    Register in gameServer.ts               :f3, 26, 27
    Define goblin buildings                 :f4, 27, 28
```
