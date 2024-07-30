import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { TileSize } from "../../../map/tile.js";
import { SelectedWorldItem } from "../../../selection/selectedWorldItem.js";
import { InteractionState } from "../../handler/interactionState.js";
import { ButtonCollection } from "../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { SelectionPresenter } from "../../view/selectionPresenter.js";
import { ActorSelectionProvider } from "./actor/provider/actorSelectionProvider.js";
import { TileSelectionProvider } from "./actor/provider/tileSelectionProvider.js";
import { TreeSelectionProvider } from "./actor/provider/treeSelectionProvider.js";
import { WorkerSelectionProvider } from "./actor/provider/workerSelectionProvider.js";

export class SelectionState extends InteractionState {
    private presenter: SelectionPresenter | null = null;
    private providers: ActorSelectionProvider[] = [
        new WorkerSelectionProvider(),
        new TreeSelectionProvider(),
        new TileSelectionProvider(),
    ];

    constructor(private selection: SelectedWorldItem) {
        super();
    }

    override onActive(): void {
        const items = this.getActionItems();
        this.presenter = new SelectionPresenter(items.left, items.right);
        this.view = this.presenter.root;
    }

    override onUpdate(_tick: number): void {
        this.updateActionbarItems();
    }

    override onDraw(context: RenderContext): void {
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
