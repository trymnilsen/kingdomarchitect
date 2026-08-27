import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    RoleComponentId,
    type RoleComponent,
} from "../../../component/worker/roleComponent.ts";
import { roleDefinitions } from "../../../../data/role/roleDefinitions.ts";
import { bookSelectionView } from "../../view/bookSelectionView.ts";
import { UpdateWorkerRoleCommand } from "../../../../server/message/command/updateWorkerRoleCommand.ts";

export class RoleSelectionState extends InteractionState {
    private _entity: Entity;
    private _roleComponent: RoleComponent;
    private _selectedRoleIndex: number = 0;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Role";
    }

    constructor(entity: Entity) {
        super();
        const roleComponent = entity.getEcsComponent(RoleComponentId);
        if (!roleComponent) {
            throw new Error(
                "RoleSelectionState requires a role component on provided entity",
            );
        }
        this._entity = entity;
        this._roleComponent = roleComponent;
        // Seed the selection from the worker's current role, falling back to
        // the first definition if the role has no entry in the book.
        const currentIndex = roleDefinitions.findIndex(
            (definition) => definition.role === roleComponent.role,
        );
        this._selectedRoleIndex = currentIndex >= 0 ? currentIndex : 0;
    }

    override getView(): ComponentDescriptor | null {
        return bookSelectionView({
            entries: roleDefinitions,
            currentIndex: roleDefinitions.findIndex(
                (definition) => definition.role === this._roleComponent.role,
            ),
            selectedIndex: this._selectedRoleIndex,
            onSelected: (index: number) => {
                this._selectedRoleIndex = index;
            },
            onAssign: (index: number) => {
                this.context.commandDispatcher(
                    UpdateWorkerRoleCommand(
                        this._entity,
                        roleDefinitions[index].role,
                    ),
                );
                this.context.stateChanger.pop();
            },
            onCancel: () => {
                this.context.stateChanger.pop();
            },
        });
    }
}
