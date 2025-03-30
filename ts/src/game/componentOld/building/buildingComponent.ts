import { Sprite2, emptySprite } from "../../../module/asset/sprite.js";
import { Adjacency } from "../../../common/adjacency.js";
import { Point } from "../../../common/point.js";
import {
    Building,
    nullBuilding,
    nullBuildingId,
} from "../../../data/building/building.js";
import { getBuildingById } from "../../../data/building/buildings.js";
import { InventoryItemQuantity } from "../../../data/inventory/inventoryItemQuantity.js";
import { woodResourceItem } from "../../../data/inventory/items/resources.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { EntityComponent } from "../entityComponent.js";
import { SpatialChunkMapComponent } from "../world/spatialChunkMapComponent.js";

const neededBuildResources = [
    {
        item: woodResourceItem,
        amount: 20,
    },
];

export class BuildingComponent extends EntityComponent {
    private buildingSprite: Sprite2 = emptySprite;
    private scaffoldSprite: Sprite2 = emptySprite;
    private _building: Building = nullBuilding;
    private _isScaffolded = true;
    //TODO: Use inventory component with a tag for the provided items
    private _providedItems: { [id: string]: number } = {};

    get building(): Readonly<Building> {
        return this._building;
    }

    get isScaffolded(): boolean {
        return this._isScaffolded;
    }

    get remainingItems(): ReadonlyArray<InventoryItemQuantity> {
        //TODO: Optimize with a map not null
        return neededBuildResources
            .filter((resourceNeeded) => {
                const providedAmount =
                    this._providedItems[resourceNeeded.item.id] ?? 0;
                //If the provided amount is less than needed we return true
                //this should give us a list of the items remaining
                return providedAmount < resourceNeeded.amount;
            })
            .map((resourceNeeded) => {
                //We transform the list from a list of the amount currently provided
                //to a list of the amount of items remaining
                const providedAmount =
                    this._providedItems[resourceNeeded.item.id] ?? 0;

                return {
                    item: resourceNeeded.item,
                    amount: Math.max(0, resourceNeeded.amount - providedAmount),
                };
            });
    }

    constructor(
        buildingSprite: Sprite2,
        scaffoldSprite: Sprite2,
        building: Building,
        isScaffolded: boolean = true,
    ) {
        super();
        this.buildingSprite = buildingSprite;
        this.scaffoldSprite = scaffoldSprite;
        this._building = building;
        this._isScaffolded = isScaffolded;
    }

    supplyBuildingMaterial(items: InventoryItemQuantity[]) {
        for (const buildingMaterial of items) {
            const existingItemAmount =
                this._providedItems[buildingMaterial.item.id];
            if (!existingItemAmount) {
                this._providedItems[buildingMaterial.item.id] =
                    buildingMaterial.amount;
            } else {
                this._providedItems[buildingMaterial.item.id] =
                    existingItemAmount + buildingMaterial.amount;
            }
        }
    }

    finishBuild() {
        this._isScaffolded = false;
        if (this._building.adjacencySprite) {
            this.updateAdjacentBuildings();
        }
    }

    override onStart(_tick: number): void {
        this.updateAdjacentBuildings();
    }

    /**
     * Update the adjacency of this building.
     * Some buildings like roads and walls support different sprites based
     * on adjacent buildings to make it seem like they are connected.
     *
     * @param adjacency an optional adjaceny to avoid re-checking. If not
     * provided the component will look for adjacent component
     */
    updateOwnAdjacency(adjacency?: Adjacency) {
        if (this._building.adjacencySprite) {
            if (!adjacency) {
                adjacency = this.getAdjacency().adjacency;
            }

            const newSprite = this._building.adjacencySprite(adjacency);
            this.buildingSprite = newSprite;
        }
    }

    override onDraw(context: RenderScope, screenPosition: Point): void {
        let sprite = this.buildingSprite;
        if (this.isScaffolded) {
            sprite = this.scaffoldSprite;
        }
        if (!!this.building.adjacencySprite && !this.isScaffolded) {
            context.drawScreenSpaceSprite({
                sprite: sprite,
                x: screenPosition.x,
                y: screenPosition.y,
                targetWidth: 40,
                targetHeight: 40,
            });
        } else {
            context.drawScreenSpaceSprite({
                sprite: sprite,
                x: screenPosition.x + 3,
                y: screenPosition.y + 2,
                targetWidth: 32,
                targetHeight: 32,
            });
        }
    }

    private getAdjacency(): AdjacentBuildings {
        let adjacency = "";
        const leftBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x - 1,
            y: this.entity.worldPosition.y,
        });

        if (leftBuilding) {
            adjacency += Adjacency.Left;
        }

        const rightBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x + 1,
            y: this.entity.worldPosition.y,
        });

        if (rightBuilding) {
            adjacency += Adjacency.Right;
        }

        const upperBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x,
            y: this.entity.worldPosition.y - 1,
        });

        if (upperBuilding) {
            adjacency += Adjacency.Upper;
        }

        const bottomBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x,
            y: this.entity.worldPosition.y + 1,
        });

        if (bottomBuilding) {
            adjacency += Adjacency.Bottom;
        }

        return {
            adjacency: adjacency as Adjacency,
            left: leftBuilding,
            right: rightBuilding,
            upper: upperBuilding,
            bottom: bottomBuilding,
        };
    }

    private getBuildingAtPoint(point: Point): BuildingComponent | null {
        const rootEntity = this.entity.getRootEntity();
        const entities = rootEntity
            .requireComponent(SpatialChunkMapComponent)
            .getEntitiesAt(point.x, point.y);

        let buildingComponent: BuildingComponent | null = null;
        for (const entity of entities) {
            const component = entity.getComponent(BuildingComponent);
            if (!!component && !!component.building.adjacencySprite) {
                buildingComponent = component;
                break;
            }
        }

        return buildingComponent;
    }

    private updateAdjacentBuildings() {
        //Get upper builder
        //Check if it has a building component
        //if it does call update own adjacency on it
        const adjacentBuildings = this.getAdjacency();
        if (adjacentBuildings.left) {
            adjacentBuildings.left.updateOwnAdjacency();
        }
        if (adjacentBuildings.right) {
            adjacentBuildings.right.updateOwnAdjacency();
        }
        if (adjacentBuildings.upper) {
            adjacentBuildings.upper.updateOwnAdjacency();
        }
        if (adjacentBuildings.bottom) {
            adjacentBuildings.bottom.updateOwnAdjacency();
        }

        this.updateOwnAdjacency(adjacentBuildings.adjacency);
    }
}

type AdjacentBuildings = {
    adjacency: Adjacency;
    left: BuildingComponent | null;
    right: BuildingComponent | null;
    upper: BuildingComponent | null;
    bottom: BuildingComponent | null;
};
