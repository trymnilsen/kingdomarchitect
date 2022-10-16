import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { HorizontalAlignment } from "../uiAlignment";
import { UILayoutContext } from "../uiLayoutContext";
import { fillUiSize, UISize, UIView, wrapUiSize } from "../uiView";
import { AxisPlacement, insertAndShift } from "./axisPlacement";

export class UIColumn extends UIView {
    private weights: { [view: string]: number } = {};
    private totalWeight: number = 0;
    private _horizontalAlignment: HorizontalAlignment =
        HorizontalAlignment.Center;

    get horizontalAlignment(): HorizontalAlignment {
        return this._horizontalAlignment;
    }
    set horizontalAlignment(horizontalAlignment: HorizontalAlignment) {
        this._horizontalAlignment = horizontalAlignment;
    }

    addView(view: UIView, weight: number | null = null) {
        if (view.size.height == fillUiSize && !weight) {
            throw new Error(
                "Column children cannot fill height without weight"
            );
        }

        if (view.size.height == wrapUiSize && !!weight) {
            throw new Error("Cannot use weight when height is wrapSize");
        }

        if (weight) {
            if (weight <= 0) {
                throw new Error("Weight needs to be larger than 0");
            }

            if (!view.id) {
                throw new Error("Weighted column children needs an id");
            }

            this.weights[view.id] = weight;
            // update the total weight
            this.totalWeight += weight;
        }

        super.addView(view);
    }

    hitTest(screenPoint: Point): boolean {
        return false;
    }

    layout(context: UILayoutContext, constraints: UISize): UISize {
        const offsets: AxisPlacement[] = [];
        let measuredWidth = 0;
        let measuredHeight = 0;
        // First measure the items without a weight
        for (let i = 0; i < this.children.length; i++) {
            // Initialise offset array
            offsets[i] = { start: 0, end: 0 };

            // Check if child has a weight
            const child = this.children[i];
            if (child.id && this.weights[child.id]) {
                // The child had a weight, continue to next item
                continue;
            }

            // Layout the child
            const layoutSize = child.layout(context, constraints);
            const newTotalHeight = measuredHeight + layoutSize.height;
            if (newTotalHeight > constraints.height) {
                throw new Error("Non weighted column children height overflow");
            }

            // Set the offset of this item to the total measure height of past
            // children. This makes the current child start at the bottom of the
            // previous child
            offsets[i] = {
                start: measuredHeight,
                end: newTotalHeight,
            };

            measuredHeight += layoutSize.height;
            if (layoutSize.width > measuredWidth) {
                measuredWidth = layoutSize.width;
            }
        }

        //Then measure an place any weighted children
        if (this.totalWeight > 0) {
            const remainingHeight = constraints.height - measuredHeight;
            for (let i = 0; i < this.children.length; i++) {
                const child = this.children[i];
                if (!child.id || !this.weights[child.id]) {
                    // Continue if this child has no weights
                    continue;
                }

                // Calculate the amount of remaining height
                // this weight represents
                const weight = this.weights[child.id];
                const weightedFraction = weight / this.totalWeight;
                const weightedHeight = remainingHeight * weightedFraction;
                measuredHeight += weightedHeight;

                // Run layout on the child
                const layoutSize = child.layout(context, {
                    width: constraints.width,
                    height: weightedHeight,
                });
                // Get the offset of the previous child to find
                // where we should start
                let previousOffsets = { start: 0, end: 0 };
                if (i > 0) {
                    previousOffsets = offsets[i - 1];
                }

                const top = previousOffsets.end;
                const weightedOffset = {
                    start: top,
                    end: top + weightedHeight,
                };

                if (weightedOffset.end < weightedOffset.start) {
                    throw new Error("Offset bottom cannot be less than top");
                }
                // Insert the weighted items size and shift any following items
                // down by its size
                insertAndShift(offsets, i, weightedOffset);
            }
        }

        this._measuredSize = {
            width: measuredWidth,
            height: measuredHeight,
        };

        // Layout the children based on the offsets
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const offset = offsets[i];
            child.offset = {
                x: 0,
                y: offset.start,
            };
        }

        return this._measuredSize;
    }

    draw(context: UIRenderContext): void {
        for (const child of this.children) {
            child.draw(context);
        }
    }

    isInteractable(): boolean {
        return false;
    }
}
