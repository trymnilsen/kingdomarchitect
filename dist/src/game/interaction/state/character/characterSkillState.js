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
import { allSides, symmetricSides } from "../../../../common/sides.js";
import { magicSkills } from "../../../../data/skill/magic.js";
import { meleeSkills } from "../../../../data/skill/melee.js";
import { productivitySkills } from "../../../../data/skill/productivity.js";
import { rangedSkills } from "../../../../data/skill/ranged.js";
import { SkillCategory } from "../../../../data/skill/skill.js";
import { bookInkColor } from "../../../../ui/color.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { uiText } from "../../../../ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../ui/uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { UIBookLayout } from "../../view/uiBookLayout.js";
import { UISkillCategoryTree } from "./uiSkillCategoryTree.js";
export class CharacterSkillState extends InteractionState {
    get isModal() {
        return true;
    }
    tabSelected(index) {
        this._masterDetailsView.setTabs(this.getTabs(index));
        const skillTree = this.getSkillTree(index);
        const category = this.getSkillCategory(index);
        const masterView = this.getMasterView(skillTree, category);
        this._masterDetailsView.leftPage = masterView;
    }
    getTabs(selectedTab) {
        return [
            {
                icon: sprites2.sword_skill,
                isSelected: selectedTab == 0,
                onTap: (index)=>{
                    this.tabSelected(index);
                }
            },
            {
                icon: sprites2.worker_skill,
                isSelected: selectedTab == 1,
                onTap: (index)=>{
                    this.tabSelected(index);
                }
            },
            {
                icon: sprites2.archer_skill,
                isSelected: selectedTab == 2,
                onTap: (index)=>{
                    this.tabSelected(index);
                }
            },
            {
                icon: sprites2.wizard_hat_skill,
                isSelected: selectedTab == 3,
                onTap: (index)=>{
                    this.tabSelected(index);
                }
            }
        ];
    }
    getSkillTree(tabIndex) {
        switch(tabIndex){
            case 1:
                return productivitySkills;
            case 2:
                return rangedSkills;
            case 3:
                return magicSkills;
            default:
                return meleeSkills;
        }
    }
    getSkillCategory(tabIndex) {
        switch(tabIndex){
            case 1:
                return SkillCategory.Productivity;
            case 2:
                return SkillCategory.Ranged;
            case 3:
                return SkillCategory.Magic;
            default:
                return SkillCategory.Melee;
        }
    }
    getMasterView(skillTree, category) {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.topLeft,
            padding: {
                left: 40,
                right: 32,
                top: 32,
                bottom: 48
            },
            children: [
                new UISkillCategoryTree(skillTree, category)
            ]
        });
    }
    getDetailsView(index) {
        return uiBox({
            width: 300,
            height: 400,
            padding: {
                bottom: 32,
                left: 24,
                top: 32,
                right: 40
            },
            children: [
                uiText({
                    padding: symmetricSides(0, 8),
                    text: "Skill details",
                    style: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 20
                    },
                    width: fillUiSize,
                    height: wrapUiSize
                })
            ]
        });
    }
    constructor(){
        super();
        _define_property(this, "_masterDetailsView", void 0);
        _define_property(this, "_activeSkillTree", void 0);
        this._activeSkillTree = meleeSkills;
        const items = [
            {
                icon: sprites2.empty_sprite,
                text: "Unlock",
                onClick: ()=>{
                    console.log("Unlock");
                }
            },
            {
                icon: sprites2.empty_sprite,
                text: "Cancel",
                onClick: ()=>{
                    console.log("Unlock");
                }
            }
        ];
        const masterView = this.getMasterView(meleeSkills, SkillCategory.Melee);
        const detailsView = this.getDetailsView(0);
        this._masterDetailsView = new UIBookLayout();
        this._masterDetailsView.leftPage = masterView;
        this._masterDetailsView.rightPage = detailsView;
        this._masterDetailsView.setTabs(this.getTabs(0));
        const contentView = uiBox({
            id: "characterSkillsLayout",
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            alignment: uiAlignment.center,
            children: [
                this._masterDetailsView
            ]
        });
        this.view = new UIActionbarScaffold(contentView, items, [], {
            width: fillUiSize,
            height: fillUiSize
        });
    }
}
