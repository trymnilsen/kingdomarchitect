function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { Adjacency } from "../../../../common/adjacency.js";
import { EntityComponent } from "../entityComponent.js";
export class BuildingComponent extends EntityComponent {
    get building() {
        return this._building;
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
     */ updateOwnAdjacency(adjacency) {
        if (this._building.adjacencySprite) {
            if (!adjacency) {
                adjacency = this.getAdjacency().adjacency;
            }
            const newSprite = this._building.adjacencySprite(adjacency);
            this.buildingSprite = newSprite;
        }
    }
    getAdjacency() {
        let adjacency = "";
        const leftBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x - 1,
            y: this.entity.worldPosition.y
        });
        if (!!leftBuilding) {
            adjacency += Adjacency.Left;
        }
        const rightBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x + 1,
            y: this.entity.worldPosition.y
        });
        if (!!rightBuilding) {
            adjacency += Adjacency.Right;
        }
        const upperBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x,
            y: this.entity.worldPosition.y - 1
        });
        if (!!upperBuilding) {
            adjacency += Adjacency.Upper;
        }
        const bottomBuilding = this.getBuildingAtPoint({
            x: this.entity.worldPosition.x,
            y: this.entity.worldPosition.y + 1
        });
        if (!!bottomBuilding) {
            adjacency += Adjacency.Bottom;
        }
        return {
            adjacency: adjacency,
            left: leftBuilding,
            right: rightBuilding,
            upper: upperBuilding,
            bottom: bottomBuilding
        };
    }
    getBuildingAtPoint(point) {
        const rootEntity = this.entity.getRootEntity();
        const entities = rootEntity.getEntityAt(point);
        let buildingComponent = null;
        for (const entity of entities){
            const component = entity.getComponent(BuildingComponent);
            if (!!component && !!component.building.adjacencySprite) {
                buildingComponent = component;
                break;
            }
        }
        return buildingComponent;
    }
    updateAdjacentBuildings() {
        //Get upper builder
        //Check if it has a building component
        //if it does call update own adjacency on it
        const adjacentBuildings = this.getAdjacency();
        if (!!adjacentBuildings.left) {
            adjacentBuildings.left.updateOwnAdjacency();
        }
        if (!!adjacentBuildings.right) {
            adjacentBuildings.right.updateOwnAdjacency();
        }
        if (!!adjacentBuildings.upper) {
            adjacentBuildings.upper.updateOwnAdjacency();
        }
        if (!!adjacentBuildings.bottom) {
            adjacentBuildings.bottom.updateOwnAdjacency();
        }
        this.updateOwnAdjacency(adjacentBuildings.adjacency);
    }
    onDraw(context, screenPosition) {
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
                targetHeight: 40
            });
        } else {
            context.drawScreenSpaceSprite({
                sprite: sprite,
                x: screenPosition.x + 3,
                y: screenPosition.y + 2,
                targetWidth: 32,
                targetHeight: 32
            });
        }
    }
    constructor(buildingSprite, scaffoldSprite, building){
        super();
        _define_property(this, "buildingSprite", void 0);
        _define_property(this, "scaffoldSprite", void 0);
        _define_property(this, "_building", void 0);
        _define_property(this, "isScaffolded", true);
        this._building = building;
        this.buildingSprite = buildingSprite;
        this.scaffoldSprite = scaffoldSprite;
    }
}
