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
import { sprites2 } from "../../../../asset/sprite.js";
import { zeroBounds } from "../../../../common/bounds.js";
import { addPoint } from "../../../../common/point.js";
import { SkillCategory } from "../../../../data/skill/skill.js";
import { skills } from "../../../../data/skill/skills.js";
import { UIView } from "../../../../ui/uiView.js";
export class UISkillTree extends UIView {
    panView(movement) {
        this.scrollTranslation.x += movement.x;
        this.scrollTranslation.y += movement.y;
    }
    hitTest(screenPoint) {
        return true;
    }
    layout(layoutContext, constraints) {
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height
        };
        this.halfWidth = constraints.width / 2;
        this.halfHeight = constraints.height / 2;
        this.drawBounds = {
            x1: 2,
            y1: 2,
            x2: this._measuredSize.width - 2,
            y2: this._measuredSize.height - 2
        };
        return this._measuredSize;
    }
    draw(context) {
        const bounds = {
            x1: this.screenPosition.x + this.drawBounds.x1,
            y1: this.screenPosition.y + this.drawBounds.y1,
            x2: this.screenPosition.x + this.drawBounds.x2,
            y2: this.screenPosition.y + this.drawBounds.y2
        };
        context.drawWithClip(bounds, (clippedContext)=>{
            const screenPositionWithScrollTranslation = addPoint(this.scrollTranslation, this.screenPosition);
            this.drawSkillCategory(clippedContext, screenPositionWithScrollTranslation, skills.magic, SkillCategory.Magic);
            this.drawSkillCategory(clippedContext, screenPositionWithScrollTranslation, skills.melee, SkillCategory.Melee);
            this.drawSkillCategory(clippedContext, screenPositionWithScrollTranslation, skills.productivity, SkillCategory.Productivity);
            this.drawSkillCategory(clippedContext, screenPositionWithScrollTranslation, skills.ranged, SkillCategory.Ranged);
            clippedContext.drawScreenSpaceRectangle({
                x: screenPositionWithScrollTranslation.x,
                y: screenPositionWithScrollTranslation.y,
                fill: "red",
                width: 8,
                height: 8
            });
        });
    }
    onTapDown(screenPoint) {
        return true;
    }
    drawSkillCategory(context, screenPositionWithScrollTranslation, skills, category) {
        for(let tierIndex = 0; tierIndex < skills.length; tierIndex++){
            const skillTier = skills[tierIndex];
            for(let skillIndex = 0; skillIndex < skillTier.length; skillIndex++){
                const skillEntry = skillTier[skillIndex];
                const skillPosition = this.getItemPosition(category, tierIndex, skillIndex, skillTier.length);
                const offsetPosition = addPoint(screenPositionWithScrollTranslation, skillPosition);
                context.drawScreenSpaceSprite({
                    sprite: sprites2.fancy_wood_background,
                    x: offsetPosition.x,
                    y: offsetPosition.y
                });
                context.drawScreenSpaceSprite({
                    sprite: skillEntry.asset,
                    x: offsetPosition.x + 7,
                    y: offsetPosition.y + 7
                });
            }
        }
    }
    getItemPosition(category, depth, index, numberOfIndexes) {
        const halfOfNumberOfIndexSize = numberOfIndexes / 2 * itemPositionIndexSize;
        const mainAxis = depth * itemPositionIndexSize + halfItemPositionIndexSize;
        const crossAxis = index * itemPositionIndexSize - halfOfNumberOfIndexSize;
        switch(category){
            case SkillCategory.Melee:
                return {
                    x: mainAxis * -1 - itemPositionIndexSize,
                    y: crossAxis
                };
            case SkillCategory.Productivity:
                return {
                    x: mainAxis,
                    y: crossAxis
                };
            case SkillCategory.Magic:
                return {
                    x: crossAxis,
                    y: mainAxis * -1 - itemPositionIndexSize
                };
            case SkillCategory.Ranged:
                return {
                    x: crossAxis,
                    y: mainAxis
                };
            default:
                throw new Error(`Unknown category ${category}`);
        }
    }
    constructor(...args){
        super(...args);
        _define_property(this, "scrollTranslation", {
            x: -16,
            y: -16
        });
        _define_property(this, "halfWidth", 0);
        _define_property(this, "halfHeight", 0);
        _define_property(this, "drawBounds", zeroBounds());
    }
}
const itemPositionIndexSize = 64;
const halfItemPositionIndexSize = itemPositionIndexSize / 2;
