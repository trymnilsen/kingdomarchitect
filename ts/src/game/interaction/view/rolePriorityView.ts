import { allSides } from "../../../common/sides.ts";
import { spriteRefs } from "../../../asset/sprite.ts";
import type { RoleDefinition } from "../../../data/role/roleDefinitions.ts";
import { getRoleDefinition } from "../../../data/role/roleDefinitions.ts";
import type { WorkerRole } from "../../component/worker/roleComponent.ts";
import {
    ROLE_SLOT_COUNT,
    roleSlot,
    type RoleOrder,
} from "../../component/worker/rolePriority.ts";
import { implementedRoles } from "../../behavior/implementedRoles.ts";
import { hiddenBookInkColor } from "../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../ui/declarative/uiButton.ts";
import { uiDivider } from "../../../ui/declarative/uiDivider.ts";
import { uiImage } from "../../../ui/declarative/uiImage.ts";
import { uiColumn, uiRow } from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import {
    bookFadedSubtitleStyle,
    bookFadedTextStyle,
    bookSubtitleStyle,
    bookTextStyle,
    bookTitleStyle,
} from "./bookTextStyles.ts";
import { uiScaffold } from "./uiScaffold.ts";

export type RolePriorityViewProps = {
    order: RoleOrder;
    selectedRole: WorkerRole;
    onSelect: (role: WorkerRole) => void;
    onRaise: (role: WorkerRole) => void;
    onLower: (role: WorkerRole) => void;
    onClose: () => void;
};

type RoleListItemProps = {
    definition: RoleDefinition;
    isSelected: boolean;
    isExcluded: boolean;
    onTap: () => void;
    /** Keyed by role so a row keeps its identity as the order is rearranged. */
    key: string | number;
};

const roleListItem = createComponent<RoleListItemProps>(({ props }) => {
    let backgroundSprite = spriteRefs.book_grid_item;
    if (props.isSelected) {
        backgroundSprite = spriteRefs.book_grid_item_focused;
    }

    // Faded rather than removed, so the order below the line stays readable.
    let nameStyle = bookTextStyle;
    let subtitleStyle = bookSubtitleStyle;
    if (props.isExcluded) {
        nameStyle = bookFadedTextStyle;
        subtitleStyle = bookFadedSubtitleStyle;
    }

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
                    sprite: props.definition.icon,
                    width: 32,
                    height: 32,
                }),
                uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        uiText({
                            content: props.definition.name,
                            textStyle: nameStyle,
                        }),
                        uiText({
                            content: props.definition.subtitle,
                            textStyle: subtitleStyle,
                        }),
                    ],
                }),
            ],
        }),
    });
});

/**
 * The line between roles performed and refused. It carries a note in the two
 * cases the list cannot explain itself: nothing permitted, nothing excluded.
 */
function createDividerRow(order: RoleOrder): ComponentDescriptor {
    const notes: ComponentDescriptor[] = [];
    if (order.permittedDutyCount === 0) {
        notes.push(
            uiText({
                content:
                    "This unit won't perform any duties. Raise a role above the line to put it to work.",
                textStyle: bookSubtitleStyle,
                width: fillUiSize,
            }),
        );
    }
    if (order.permittedDutyCount === order.dutyPriority.length) {
        notes.push(
            uiText({
                content: "Move a role below the line to exclude it.",
                textStyle: bookFadedSubtitleStyle,
                width: fillUiSize,
            }),
        );
    }

    return uiColumn({
        width: fillUiSize,
        height: wrapUiSize,
        gap: 4,
        children: [
            uiDivider({
                color: hiddenBookInkColor,
                thickness: 2,
                height: 8,
            }),
            ...notes,
        ],
    });
}

function createListPage(
    order: RoleOrder,
    selectedRole: WorkerRole,
    onSelect: (role: WorkerRole) => void,
): ComponentDescriptor {
    const rows: ComponentDescriptor[] = [];
    order.dutyPriority.forEach((role, rank) => {
        // In front of the first refused role. With nothing permitted, row one.
        if (rank === order.permittedDutyCount) {
            rows.push(createDividerRow(order));
        }
        rows.push(
            roleListItem({
                definition: getRoleDefinition(role),
                isSelected: role === selectedRole,
                isExcluded: rank >= order.permittedDutyCount,
                onTap: () => onSelect(role),
                key: role,
            }),
        );
    });
    // With nothing excluded the line sits past the last role, so the loop
    // above never reaches it.
    if (order.permittedDutyCount === order.dutyPriority.length) {
        rows.push(createDividerRow(order));
    }

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            gap: 4,
            children: rows,
        }),
    });
}

type MoveButtonProps = {
    label: string;
    isEnabled: boolean;
    onTap: () => void;
};

const moveButton = createComponent<MoveButtonProps>(({ props }) => {
    let labelStyle = bookTextStyle;
    if (!props.isEnabled) {
        labelStyle = bookFadedTextStyle;
    }

    // Keeps its frame but takes no tap, so the pair does not shift at the ends.
    let onTap: (() => void) | undefined = props.onTap;
    if (!props.isEnabled) {
        onTap = undefined;
    }

    return uiButton({
        width: wrapUiSize,
        height: wrapUiSize,
        padding: 8,
        background: ninePatchBackground({
            sprite: spriteRefs.book_grid_item,
            sides: allSides(8),
            scale: 1,
        }),
        onTap,
        child: uiText({
            content: props.label,
            textStyle: labelStyle,
        }),
    });
});

function createDetailPage(
    order: RoleOrder,
    role: WorkerRole,
    onRaise: (role: WorkerRole) => void,
    onLower: (role: WorkerRole) => void,
): ComponentDescriptor {
    const definition = getRoleDefinition(role);
    const slot = roleSlot(order, role);

    const children: ComponentDescriptor[] = [
        uiBox({
            width: fillUiSize,
            height: 100,
            background: ninePatchBackground({
                sprite: spriteRefs.book_grid_item,
                sides: allSides(8),
                scale: 1,
            }),
            child: uiImage({
                sprite: definition.icon,
                width: 64,
                height: 64,
            }),
        }),
        uiText({ content: definition.name, textStyle: bookTitleStyle }),
        uiText({ content: definition.subtitle, textStyle: bookTextStyle }),
        uiText({
            content: definition.description,
            textStyle: bookSubtitleStyle,
        }),
    ];

    // So ranking a spy first and seeing nothing reads as unbuilt, not broken.
    if (!implementedRoles.has(role)) {
        children.push(
            uiText({
                content:
                    "No roles yet. Nothing in the realm calls for this work.",
                textStyle: bookFadedSubtitleStyle,
                width: fillUiSize,
            }),
        );
    }

    children.push(
        uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: [
                moveButton({
                    label: "Raise",
                    isEnabled: slot > 0,
                    onTap: () => onRaise(role),
                }),
                moveButton({
                    label: "Lower",
                    isEnabled: slot < ROLE_SLOT_COUNT - 1,
                    onTap: () => onLower(role),
                }),
            ],
        }),
    );

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children,
        }),
    });
}

export const rolePriorityView = createComponent<RolePriorityViewProps>(
    ({ props }) => {
        return uiScaffold({
            content: uiBookLayout({
                leftPage: createListPage(
                    props.order,
                    props.selectedRole,
                    props.onSelect,
                ),
                rightPage: createDetailPage(
                    props.order,
                    props.selectedRole,
                    props.onRaise,
                    props.onLower,
                ),
            }),
            leftButtons: [
                {
                    text: "Close",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => props.onClose(),
                },
            ],
        });
    },
    { displayName: "RolePriorityView" },
);
