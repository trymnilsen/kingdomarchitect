import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import {
    InventoryComponentId,
    type InventoryComponent,
} from "../../../component/inventoryComponent.ts";
import {
    StockpileComponentId,
    type StockpileComponent,
    getPreferredAmount,
} from "../../../component/stockpileComponent.ts";
import { SetPreferredAmountCommand } from "../../../../server/message/command/setPreferredAmountCommand.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { requestTextInput } from "../../../../ui/input/requestTextInput.ts";
import { stockpileView } from "./stockpileView.ts";

export class StockpileState extends InteractionState {
    private _buildingEntity: Entity;
    private _selectedTab: number;
    private _selectedItemIndex: number = 0;
    private _selectedPreferredItemId: string | null = null;
    private _filterText: string = "";
    private _preferredPage: number = 0;

    constructor(buildingEntity: Entity, initialTab: number = 0) {
        super();
        this._buildingEntity = buildingEntity;
        this._selectedTab = initialTab;
    }

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Stockpile";
    }

    override getView(): ComponentDescriptor | null {
        const stockpile = this._buildingEntity.requireEcsComponent(
            StockpileComponentId,
        ) as StockpileComponent;
        const inventory = this._buildingEntity.requireEcsComponent(
            InventoryComponentId,
        ) as InventoryComponent;

        return stockpileView({
            stockpile,
            inventory,
            stockpileEntityId: this._buildingEntity.id,
            selectedTab: this._selectedTab,
            selectedItemIndex: this._selectedItemIndex,
            selectedItem: inventory.items[this._selectedItemIndex],
            selectedPreferredItemId: this._selectedPreferredItemId,
            filterText: this._filterText,
            preferredPage: this._preferredPage,
            onTabChange: (tab) => {
                this._selectedTab = tab;
            },
            onSelectInventoryItem: (i) => {
                this._selectedItemIndex = i;
            },
            onSelectPreferredItem: (itemId) => {
                this._selectedPreferredItemId = itemId;
            },
            onFilterTap: () => {
                const result = requestTextInput("Filter items:");
                this._filterText = result ?? "";
                this._preferredPage = 0;
            },
            onClearFilter: () => {
                this._filterText = "";
                this._preferredPage = 0;
            },
            onPageChange: (page) => {
                this._preferredPage = page;
            },
            onAmountChange: (itemId, delta) => {
                const current = getPreferredAmount(stockpile, itemId) ?? 0;
                const newAmount = Math.max(0, current + delta);
                this.context.commandDispatcher(
                    SetPreferredAmountCommand(
                        this._buildingEntity.id,
                        itemId,
                        newAmount,
                    ),
                );
            },
            onClearPreferredAmount: (itemId) => {
                this.context.commandDispatcher(
                    SetPreferredAmountCommand(
                        this._buildingEntity.id,
                        itemId,
                        0,
                    ),
                );
            },
            onClose: () => this.context.stateChanger.pop(),
        });
    }
}
