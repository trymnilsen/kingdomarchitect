import { Sprite2, emptySprite } from "../../../asset/sprite.js";
import { Adjacency } from "../../../common/adjacency.js";
import { Point } from "../../../common/point.js";
import {
    Building,
    nullBuilding,
    nullBuildingId,
} from "../../../data/building/building.js";
import { getBuildingById } from "../../../data/building/buildings.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { EntityComponent } from "../entityComponent.js";
import { ChunkMapComponent } from "../root/chunk/chunkMapComponent.js";

type BuildingComponentBundle = {
    buildingSprite: Sprite2;
    scaffoldSprite: Sprite2;
    buildingId: string;
    isScaffolded: boolean;
};

export class BuildingComponent extends EntityComponent<BuildingComponentBundle> {
    private buildingSprite: Sprite2 = emptySprite;
    private scaffoldSprite: Sprite2 = emptySprite;
    private _building: Building = nullBuilding;
    private isScaffolded: boolean = true;

    get building(): Readonly<Building> {
        return this._building;
    }

    constructor() {
        super();
    }

    static createInstance(
        buildingSprite: Sprite2,
        scaffoldSprite: Sprite2,
        buildingId: string
    ): BuildingComponent {
        const instance = new BuildingComponent();
        instance.fromComponentBundle({
            buildingId: buildingId,
            buildingSprite: buildingSprite,
            scaffoldSprite: scaffoldSprite,
            isScaffolded: true,
        });

        return instance;
    }

    finishBuild() {
        this.isScaffolded = false;
        if (this._building.adjacencySprite) {
            this.updateAdjacentBuildings();
        }
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

    override onDraw(context: RenderContext, screenPosition: Point): void {
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

    override fromComponentBundle(bundle: BuildingComponentBundle): void {
        this.buildingSprite = bundle.buildingSprite;
        this.scaffoldSprite = bundle.scaffoldSprite;
        this.isScaffolded = bundle.isScaffolded;
        const building = getBuildingById(bundle.buildingId);
        if (building) {
            this._building = building;
        } else if (bundle.buildingId === nullBuildingId) {
            this._building = nullBuilding;
        } else {
            console.error("No building found with id: ", bundle.buildingId);
        }
    }

    override toComponentBundle(): BuildingComponentBundle {
        return {
            buildingId: this.building.id,
            buildingSprite: this.buildingSprite,
            scaffoldSprite: this.scaffoldSprite,
            isScaffolded: this.isScaffolded,
        };
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
            .requireComponent(ChunkMapComponent)
            .getEntityAt(point);

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

interface AdjacentBuildings {
    adjacency: Adjacency;
    left: BuildingComponent | null;
    right: BuildingComponent | null;
    upper: BuildingComponent | null;
    bottom: BuildingComponent | null;
}
