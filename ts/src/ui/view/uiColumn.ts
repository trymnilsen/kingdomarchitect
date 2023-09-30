import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { HorizontalAlignment } from "../uiAlignment.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import { fillUiSize, UISize, wrapUiSize } from "../uiSize.js";
import { UIView } from "../uiView.js";
import { UIViewGroup } from "../uiViewGroup.js";
import { AxisPlacement, insertAndShift } from "./axisPlacement.js";

export class UIColumn extends UIViewGroup {
    private weights: Record<string, number> = {};
    private totalWeight = 0;
    private _horizontalAlignment: HorizontalAlignment =
        HorizontalAlignment.Center;

    get horizontalAlignment(): HorizontalAlignment {
        return this._horizontalAlignment;
    }
    set horizontalAlignment(horizontalAlignment: HorizontalAlignment) {
        this._horizontalAlignment = horizontalAlignment;
    }

    override addView(view: UIView, weight: number | null = null) {
        if (view.size.height == fillUiSize && !weight) {
            throw new Error(
                "Column children cannot fill height without weight",
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

    hitTest(): boolean {
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

        //Then measure and place any weighted children
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
                /*                 const layoutSize = child.layout(context, {
                    width: constraints.width,
                    height: weightedHeight,
                }); */
                const layoutSize = child.layout(context, {
                    width: constraints.width,
                    height: weightedHeight,
                });

                // check if the measured width is larger than the current
                // measured width
                if (layoutSize.width > measuredWidth) {
                    measuredWidth = layoutSize.width;
                }

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

        // !Fill size special handling!
        // If there are no children with a weight we will only increment
        // measuredHeight with the measured size of the children. E.g if the
        // constraints are 300 and we have two items each with a height of 50,
        // we will end up with a measured height of 100. If the view is the of
        // a box it will be aligned in the middle even if the wanted size of
        // _this_ view is fillheight. To remedy this, if the wanted size is
        // fill and the measured size is less than the constrainted height,
        // we will set the measured size to the constrainted size.
        // This should cause this view (the column) to still have correctly
        // sized children, but still consume all the size of its
        // parent/constraints and not be aligned in the middle if there are
        // only a few items
        if (this.size.height == fillUiSize) {
            measuredHeight = constraints.height;
        }

        this._measuredSize = {
            width: measuredWidth,
            height: measuredHeight,
        };

        // Layout the children based on the offsets
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const offset = offsets[i];
            // Position the child on the horizontal axis if its size is
            // less than ours
            const childWidth = child.measuredSize.width;
            let horizontalOffset = 0;
            if (childWidth && childWidth < measuredWidth) {
                const childParentWidthDifferent = measuredWidth - childWidth;
                if (this._horizontalAlignment == HorizontalAlignment.Center) {
                    horizontalOffset = childParentWidthDifferent / 2;
                } else if (
                    this._horizontalAlignment == HorizontalAlignment.Right
                ) {
                    horizontalOffset = childParentWidthDifferent;
                }
            }
            child.offset = {
                x: horizontalOffset,
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
