import { generateId } from "../../../../src/common/idGenerator.js";
import { getBuildingById } from "../../../../src/data/building/buildings.js";
import { InventoryComponent2 } from "../../../../src/game/component/inventory/inventoryComponent.js";
import { buildingPrefab } from "../../../../src/game/prefab/buildingPrefab.js";
import { workerPrefab } from "../../../../src/game/prefab/workerPrefab.js";
import { EntityTestProxy } from "../entityTestProxy.js";
import { WorldTestScaffold } from "./worldTestScaffold.js";

export class TwoRunnersAndStockpileTestScaffold extends WorldTestScaffold {
    private _stockpile: EntityTestProxy;
    private _unfinishedBuildings: EntityTestProxy;
    private _firstWorker: EntityTestProxy;
    private _secondWorker: EntityTestProxy;

    public get stockpile(): EntityTestProxy {
        return this._stockpile;
    }

    public get unfinishedBuilding(): EntityTestProxy {
        return this._unfinishedBuildings;
    }

    public get firstWorker(): EntityTestProxy {
        return this._firstWorker;
    }

    public get secondWorker(): EntityTestProxy {
        return this._secondWorker;
    }

    constructor() {
        super();
        const stockpileBuilding = getBuildingById("stockpile");
        if (!stockpileBuilding) {
            throw Error("No building with stockpile id");
        }

        const woodenBuilding = getBuildingById("woodenhouse");
        if (!woodenBuilding) {
            throw Error("No building with woodenhouse id");
        }

        const inventoryComponent = new InventoryComponent2();

        this._stockpile = new EntityTestProxy(
            buildingPrefab(
                generateId("stockpile"),
                stockpileBuilding,
                [inventoryComponent],
                false,
            ),
        );
        this._stockpile.entity.worldPosition = { x: 1, y: 1 };

        this._unfinishedBuildings = new EntityTestProxy(
            buildingPrefab(generateId("house"), woodenBuilding),
        );
        this._unfinishedBuildings.entity.worldPosition = { x: 6, y: 6 };

        this._firstWorker = new EntityTestProxy(
            workerPrefab(generateId("worker")),
        );
        this._firstWorker.entity.requireComponent(InventoryComponent2).clear();
        this._firstWorker.entity.worldPosition = { x: 3, y: 3 };

        this._secondWorker = new EntityTestProxy(
            workerPrefab(generateId("worker")),
        );
        this._secondWorker.entity.requireComponent(InventoryComponent2).clear();
        this._secondWorker.entity.worldPosition = { x: 3, y: 4 };

        this.rootEntity.addChild(this._stockpile.entity);
        this.rootEntity.addChild(this._unfinishedBuildings.entity);
        this.rootEntity.addChild(this._firstWorker.entity);
        this.rootEntity.addChild(this._secondWorker.entity);
    }
}
