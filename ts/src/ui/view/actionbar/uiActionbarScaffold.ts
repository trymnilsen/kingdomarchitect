import { Point } from "../../../common/point";
import { Sides, allSides } from "../../../common/sides";
import { UIRenderContext } from "../../../rendering/uiRenderContext";
import { UILayoutContext } from "../../uiLayoutContext";
import { UISize } from "../../uiSize";
import { UIView } from "../../uiView";
import { UIActionbar, actionbarHeight as actionbarHeight } from "./uiActionbar";

export class UIActionbarScaffold extends UIView {
    private _sides: Sides = allSides(16);

    public get sides(): Sides {
        return this._sides;
    }

    public set sides(value: Sides) {
        this._sides = value;
    }

    constructor(
        private contentView: UIView,
        private leftActionbar: UIActionbar | null,
        private rightActionbar: UIActionbar | null,
        size: UISize
    ) {
        super(size);
        this.addView(contentView);
        if (leftActionbar) {
            this.addView(leftActionbar);
        }
        if (rightActionbar) {
            this.addView(rightActionbar);
        }
    }

    override hitTest(screenPoint: Point): boolean {
        return false;
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        //Measure the actionbars first
        //We start with the left actionbar as it should be collapsed last
        //if there is not enough space
        const horizontalPadding = this._sides.left + this._sides.right;
        const verticalPadding = this._sides.top + this._sides.bottom;
        const paddedConstraints = {
            width: constraints.width - horizontalPadding,
            height: constraints.height - verticalPadding,
        };

        const actionbarConstraints = {
            //Reserve some width for the right actionbar.
            //We substract a value here to avoid the need to do a
            //layout pass again if there is not enough space
            width: paddedConstraints.width - 100,
            height: actionbarHeight,
        };

        let leftLayout: UISize = { width: 0, height: 0 };
        if (this.leftActionbar) {
            leftLayout = this.leftActionbar.layout(
                layoutContext,
                actionbarConstraints
            );
        }

        if (this.rightActionbar) {
            const rightConstraints = {
                width: paddedConstraints.width - leftLayout.width,
                height: actionbarHeight,
            };

            this.rightActionbar.layout(layoutContext, rightConstraints);
        }

        //Now we can measure the content view
        const contentConstraints = {
            width: paddedConstraints.width,
            height: paddedConstraints.height - actionbarHeight,
        };

        this.contentView.layout(layoutContext, contentConstraints);

        //The measured size includes the padding, so we are just setting
        //the constraints we received here
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height,
        };

        //Position the actionbars
        //The left actionbar is positioned at the bottom left
        //The right actionbar is positioned at the bottom right
        if (this.leftActionbar) {
            this.leftActionbar.offset = {
                x: this._sides.left,
                y: constraints.height - actionbarHeight - this._sides.bottom,
            };
        }

        if (this.rightActionbar) {
            const size = this.rightActionbar.measuredSize?.width || 0;
            this.rightActionbar.offset = {
                x: constraints.width - size - this._sides.right,
                y: constraints.height - actionbarHeight - this._sides.bottom,
            };
        }

        this.contentView.offset = {
            x: this._sides.left,
            y: this._sides.top,
        };

        return this._measuredSize;
    }
    override draw(context: UIRenderContext): void {
        this.contentView.draw(context);
        if (this.leftActionbar) {
            this.leftActionbar.draw(context);
        }
        if (this.rightActionbar) {
            this.rightActionbar.draw(context);
        }
    }
}
