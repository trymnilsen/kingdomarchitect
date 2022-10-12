import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { fillUiSize, UISize, UIView, wrapUiSize } from "../uiView";
import { AxisPlacement, insertAndShift } from "./axisPlacement";

export enum VerticalAlignment {
    Top,
    Center,
    Bottom,
}

export class UIRow extends UIView {
    private weights: { [view: string]: number } = {};
    private totalWeight: number = 0;
    private _verticalAlignment: VerticalAlignment = VerticalAlignment.Center;

    get verticalAlignment(): VerticalAlignment {
        return this._verticalAlignment;
    }
    set verticalAlignment(horizontalAlignment: VerticalAlignment) {
        this._verticalAlignment = horizontalAlignment;
    }

    addView(view: UIView, weight: number | null = null) {
        if (view.size.width == fillUiSize && !weight) {
            throw new Error("Column children cannot fill width without weight");
        }

        if (view.size.width == wrapUiSize && !!weight) {
            throw new Error("Cannot use weight when width is wrapSize");
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
            const newTotalWidth = measuredWidth + layoutSize.width;
            if (newTotalWidth > constraints.width) {
                throw new Error("Non weighted column children width overflow");
            }

            // Set the offset of this item to the total measure height of past
            // children. This makes the current child start at the bottom of the
            // previous child
            offsets[i] = {
                start: measuredHeight,
                end: newTotalWidth,
            };

            measuredWidth += layoutSize.width;
            if (layoutSize.height > measuredHeight) {
                measuredHeight = layoutSize.height;
            }
        }

        //Then measure an place any weighted children
        if (this.totalWeight > 0) {
            const remainingWidth = constraints.width - measuredWidth;
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
                const weightedWidth = remainingWidth * weightedFraction;
                measuredWidth += weightedWidth;

                // Run layout on the child
                const layoutSize = child.layout(context, {
                    width: weightedWidth,
                    height: constraints.height,
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
                    end: top + weightedWidth,
                };

                if (weightedOffset.end < weightedOffset.start) {
                    throw new Error("Offset end cannot be less than start");
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
                x: offset.start,
                y: 0,
            };
        }

        return this._measuredSize;
    }

    draw(context: UIRenderContext): void {
        for (const child of this.children) {
            child.draw(context);
        }
    }
}
