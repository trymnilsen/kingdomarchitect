import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    RoleComponentId,
    type RoleComponent,
    type WorkerRole,
} from "../../../component/worker/roleComponent.ts";
import { roleSelectionView } from "./roleSelectionView.ts";
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
        this._selectedRoleIndex = roleComponent.role;
    }

    override getView(): ComponentDescriptor | null {
        return roleSelectionView({
            currentRole: this._roleComponent.role,
            selectedRoleIndex: this._selectedRoleIndex,
            onRoleSelected: (index: number) => {
                this._selectedRoleIndex = index;
            },
            onAssign: (role: WorkerRole) => {
                this.context.commandDispatcher(
                    UpdateWorkerRoleCommand(this._entity, role),
                );
                this.context.stateChanger.pop();
            },
            onCancel: () => {
                this.context.stateChanger.pop();
            },
        });
    }
}
