import { spriteRefs } from "../../../../asset/sprite.ts";
import { allSides } from "../../../../common/sides.ts";
import { RenderScope } from "../../../../rendering/renderScope.ts";
import { TileSize } from "../../../map/tile.ts";
import { SelectedEntityItem } from "../../selection/selectedEntityItem.ts";
import { type SelectedWorldItem } from "../../selection/selectedWorldItem.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { type ButtonCollection } from "../../view/buttonCollection.ts";
import { type UIActionbarItem } from "../../view/uiActionbar.ts";
import { type ActorSelectionProvider } from "./actor/provider/actorSelectionProvider.ts";
import { AttackSelectionProvider } from "./actor/provider/attackSelectionProvider.ts";
import { CraftingBuildingSelectionProvider } from "./actor/provider/craftingBuildingSelectionProvider.ts";
import { CollectableProvider } from "./actor/provider/collectableProvider.ts";
import { TileSelectionProvider } from "./actor/provider/tileSelectionProvider.ts";
import { ResourceSelectionProvider } from "./actor/provider/resourceSelectionProvider.ts";
import { WorkerSelectionProvider } from "./actor/provider/workerSelectionProvider.ts";
import { BuildingSelectionProvider } from "./actor/provider/buildingSelectionProvider.ts";
import { ProductionBuildingSelectionProvider } from "./actor/provider/productionBuildingSelectionProvider.ts";
import { StockpileSelectionProvider } from "./actor/provider/stockpileSelectionProvider.ts";
import { FarmBuildingSelectionProvider } from "./actor/provider/farmBuildingSelectionProvider.ts";
import { WindmillSelectionProvider } from "./actor/provider/windmillSelectionProvider.ts";
import { DismantleSelectionProvider } from "./actor/provider/dismantleSelectionProvider.ts";
import { PrioritiseJobSelectionProvider } from "./actor/provider/prioritiseJobSelectionProvider.ts";
import { type ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { uiAbsoluteLayer } from "../../../../ui/declarative/uiAbsoluteLayer.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { getCraftingJobDisplayInfos } from "../../../job/craftingJobQuery.ts";
import { craftingQueueStrip } from "../crafting/craftingQueueStrip.ts";
import { buildSelectionInfo } from "./selectionInfoQuery.ts";
import { selectionInfoPanel } from "./selectionInfoPanel.ts";
import { drawSelectionOverlays } from "./selectionOverlay.ts";

/**
 * The state the player sits in after picking something in the world.
 *
 * Its own job is wiring. The action buttons come from the provider list, the
 * info panel from `buildSelectionInfo` and `selectionInfoPanel`, and the world
 * space decorations from `drawSelectionOverlays`. Each provider decides on its
 * own whether the current selection is something it has buttons for, so adding
 * a new kind of selectable means adding a provider rather than editing here.
 */
export class SelectionState extends InteractionState {
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
        new ResourceSelectionProvider(),
        new TileSelectionProvider(),
        new CollectableProvider(),
        new CraftingBuildingSelectionProvider(),
        new ProductionBuildingSelectionProvider(),
        new StockpileSelectionProvider(),
        new AttackSelectionProvider(),
        new FarmBuildingSelectionProvider(),
        new WindmillSelectionProvider(),
        new BuildingSelectionProvider(),
        new DismantleSelectionProvider(),
        new PrioritiseJobSelectionProvider(),
    ];
    private _selection: SelectedWorldItem;

    get selection(): SelectedWorldItem {
        return this._selection;
    }

    override get stateName(): string {
        return "Selection";
    }

    constructor(selection: SelectedWorldItem) {
        super();
        this._selection = selection;
    }

    override getView(): ComponentDescriptor | null {
        const items = this.getActionItems();
        const selectionInfo = buildSelectionInfo(this._selection, this.context);

        let content: ComponentDescriptor | undefined;
        if (selectionInfo) {
            content = selectionInfoPanel(selectionInfo);
        }

        const scaffold = uiScaffold({
            leftButtons: toScaffoldButtons(items.left),
            rightButtons: toScaffoldButtons(items.right),
            content,
        });

        return this.withCraftingQueue(scaffold);
    }

    override onUpdate(_tick: number): void {
        // No need to manually update UI - declarative UI will re-render when getView() is called
    }

    override onDraw(context: RenderScope): void {
        super.onDraw(context);
        const selection = this._selection;
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            selection.tilePosition,
        );

        context.drawNinePatchSprite({
            sprite: spriteRefs.cursor,
            height: selection.selectionSize.x * TileSize,
            width: selection.selectionSize.y * TileSize,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });

        if (selection instanceof SelectedEntityItem) {
            drawSelectionOverlays(context, selection);
        }
    }

    /**
     * Floats the crafting queue above the selected building when it has work
     * queued. Anything else passes the scaffold straight through.
     */
    private withCraftingQueue(
        scaffold: ComponentDescriptor,
    ): ComponentDescriptor {
        if (!(this._selection instanceof SelectedEntityItem)) {
            return scaffold;
        }

        const displayInfos = getCraftingJobDisplayInfos(this._selection.entity);
        if (displayInfos.length === 0) {
            return scaffold;
        }

        const tileScreenPos = this.context.camera.tileSpaceToScreenSpace(
            this._selection.tilePosition,
        );
        const tileCenterX =
            tileScreenPos.x + (this._selection.selectionSize.x * TileSize) / 2;

        return uiAbsoluteLayer({
            base: scaffold,
            overlays: [
                {
                    anchorX: tileCenterX,
                    anchorY: tileScreenPos.y - 6,
                    child: craftingQueueStrip({
                        displayInfos,
                        maxVisible: 5,
                    }),
                },
            ],
        });
    }

    private getActionItems(): ButtonCollection {
        const leftItems: UIActionbarItem[] = [];
        const rightItems: UIActionbarItem[] = [];

        for (const provider of this.providers) {
            const item = provider.provideButtons(this.context, this._selection);
            leftItems.push(...item.left);
            rightItems.push(...item.right);
        }

        return {
            left: leftItems,
            right: rightItems,
        };
    }
}

/**
 * Narrows action bar items down to the fields the scaffold renders. The two
 * types overlap by hand rather than by inheritance, so the copy is explicit.
 */
function toScaffoldButtons(items: ReadonlyArray<UIActionbarItem>) {
    return items.map((item) => ({
        text: item.text,
        onClick: item.onClick,
        icon: item.icon,
        children: item.children?.map((child) => ({
            text: child.text,
            icon: child.icon,
            onClick: child.onClick,
        })),
    }));
}
