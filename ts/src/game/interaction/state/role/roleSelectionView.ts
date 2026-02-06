import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import { uiColumn, uiRow } from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import {
    roleDefinitions,
    type RoleDefinition,
} from "../../../../data/role/roleDefinitions.ts";
import type { WorkerRole } from "../../../component/worker/roleComponent.ts";

const bookTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

const bookTitleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 20,
};

const bookSubtitleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

export type RoleSelectionViewProps = {
    currentRole: WorkerRole;
    selectedRoleIndex: number;
    onRoleSelected: (index: number) => void;
    onAssign: (role: WorkerRole) => void;
    onCancel: () => void;
};

type RoleListItemProps = {
    role: RoleDefinition;
    isSelected: boolean;
    isCurrent: boolean;
    onTap: () => void;
};

const roleListItem = createComponent<RoleListItemProps>(({ props }) => {
    const backgroundSprite = props.isSelected
        ? spriteRefs.book_grid_item_focused
        : spriteRefs.book_grid_item;

    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        padding: 8,
        background: ninePatchBackground({
            sprite: backgroundSprite,
            sides: allSides(8),
            scale: 1,
        }),
        onTap: props.onTap,
        child: uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: [
                uiImage({
                    sprite: props.role.icon,
                    width: 32,
                    height: 32,
                }),
                uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        uiText({
                            content:
                                props.role.name +
                                (props.isCurrent ? " (current)" : ""),
                            textStyle: bookTextStyle,
                        }),
                        uiText({
                            content: props.role.subtitle,
                            textStyle: bookSubtitleStyle,
                        }),
                    ],
                }),
            ],
        }),
    });
});

function createMasterView(
    currentRole: WorkerRole,
    selectedIndex: number,
    onRoleSelect: (index: number) => void,
): ComponentDescriptor {
    const listItems = roleDefinitions.map((role, index) =>
        roleListItem({
            role,
            isSelected: index === selectedIndex,
            isCurrent: role.role === currentRole,
            onTap: () => onRoleSelect(index),
        }),
    );

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            gap: 4,
            children: listItems,
        }),
    });
}

function createDetailsView(selectedRoleIndex: number): ComponentDescriptor {
    const role = roleDefinitions[selectedRoleIndex];

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: [
                uiBox({
                    width: fillUiSize,
                    height: 100,
                    background: ninePatchBackground({
                        sprite: spriteRefs.book_grid_item,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiImage({
                        sprite: role.icon,
                        width: 64,
                        height: 64,
                    }),
                }),
                uiText({
                    content: role.name,
                    textStyle: bookTitleStyle,
                }),
                uiText({
                    content: role.subtitle,
                    textStyle: bookTextStyle,
                }),
                uiText({
                    content: role.description,
                    textStyle: bookSubtitleStyle,
                }),
            ],
        }),
    });
}

export const roleSelectionView = createComponent<RoleSelectionViewProps>(
    ({ props, withState }) => {
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedRoleIndex,
        );

        const masterView = createMasterView(
            props.currentRole,
            selectedIndex,
            (index: number) => {
                setSelectedIndex(index);
                props.onRoleSelected(index);
            },
        );

        const detailsView = createDetailsView(selectedIndex);

        return uiScaffold({
            content: uiBookLayout({
                leftPage: masterView,
                rightPage: detailsView,
            }),
            leftButtons: [
                {
                    text: "Assign",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        const selectedRole = roleDefinitions[selectedIndex];
                        props.onAssign(selectedRole.role);
                    },
                },
                {
                    text: "Cancel",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => props.onCancel(),
                },
            ],
        });
    },
    { displayName: "RoleSelectionView" },
);
