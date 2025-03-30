import { sprites2 } from "../../../../module/asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { SelectionInfo } from "../../../componentOld/selection/selectionInfo.js";
import { SelectionInfoComponent } from "../../../componentOld/selection/selectionInfoComponent.js";
import { TileSize } from "../../../map/tile.js";
import { SelectedEntityItem } from "../../../../module/selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../../module/selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../../module/selection/selectedWorldItem.js";
import { InteractionState } from "../../handler/interactionState.js";
import { ButtonCollection } from "../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { SelectionPresenter } from "../../view/selectionPresenter.js";
import { ActorSelectionProvider } from "./actor/provider/actorSelectionProvider.js";
import { AttackSelectionProvider } from "./actor/provider/attackSelectionProvider.js";
import { BlacksmithSelectionProvider } from "./actor/provider/blacksmithSelectionProvider.js";
import { CollectableProvider } from "./actor/provider/collectableProvider.js";
import { TileSelectionProvider } from "./actor/provider/tileSelectionProvider.js";
import { TreeSelectionProvider } from "./actor/provider/treeSelectionProvider.js";
import { WorkerSelectionProvider } from "./actor/provider/workerSelectionProvider.js";

export class SelectionState extends InteractionState {
    private presenter: SelectionPresenter | null = null;
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
        new TreeSelectionProvider(),
        new TileSelectionProvider(),
        new CollectableProvider(),
        new BlacksmithSelectionProvider(),
        new AttackSelectionProvider(),
    ];

    override get stateName(): string {
        return "Selection";
    }

    constructor(private selection: SelectedWorldItem) {
        super();
    }

    override onActive(): void {
        const items = this.getActionItems();
        this.presenter = new SelectionPresenter(items.left, items.right);
        this.presenter.setSelectionInfo(this.getSelectionInfo());
        this.view = this.presenter.root;
    }

    override onUpdate(_tick: number): void {
        this.updateActionbarItems();
    }

    override onDraw(context: RenderScope): void {
        super.onDraw(context);

        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.selection.tilePosition,
        );

        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
            height: this.selection.selectionSize.x * TileSize,
            width: this.selection.selectionSize.y * TileSize,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });
    }

    private getSelectionInfo(): SelectionInfo | null {
        if (this.selection instanceof SelectedTileItem) {
            const type = this.selection.groundTile.type;
            if (!!type) {
                return {
                    title: type,
                    subtitle: "Tile",
                    icon: sprites2.blue_book,
                };
            } else {
                return null;
            }
        } else if (this.selection instanceof SelectedEntityItem) {
            const selectionComponent = this.selection.entity.getComponent(
                SelectionInfoComponent,
            );

            if (!selectionComponent) {
                return null;
            }

            return selectionComponent.getSelectionInfo();
        } else {
            return null;
        }
    }

    private getActionItems(): ButtonCollection {
        const leftItems: UIActionbarItem[] = [];
        const rightItems: UIActionbarItem[] = [];

        for (const provider of this.providers) {
            const item = provider.provideButtons(this.context, this.selection);
            leftItems.push(...item.left);
            rightItems.push(...item.right);
        }

        return {
            left: leftItems,
            right: rightItems,
        };
    }

    private updateActionbarItems() {
        const items = this.getActionItems();
        this.presenter?.setLeftMenu(items.left);
        this.presenter?.setRightMenu(items.right);
    }
}
