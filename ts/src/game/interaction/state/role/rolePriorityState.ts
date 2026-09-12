import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    RoleComponentId,
    type RoleComponent,
    type WorkerRole,
} from "../../../component/worker/roleComponent.ts";
import {
    lowerRole,
    raiseRole,
    type RoleOrder,
} from "../../../component/worker/rolePriority.ts";
import { rolePriorityView } from "../../view/rolePriorityView.ts";
import { SetRolePriorityCommand } from "../../../../server/message/command/setRolePriorityCommand.ts";

/**
 * The book page where a worker's roles are put in order
 */
export class RolePriorityState extends InteractionState {
    private _entity: Entity;
    private _roleComponent: RoleComponent;
    private _selectedRole: WorkerRole;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Roles";
    }

    constructor(entity: Entity) {
        super();
        const roleComponent = entity.getEcsComponent(RoleComponentId);
        if (!roleComponent) {
            throw new Error(
                "RolePriortyState requires a role component on provided entity",
            );
        }
        this._entity = entity;
        this._roleComponent = roleComponent;
        this._selectedRole = roleComponent.dutyPriority[0];
    }

    override getView(): ComponentDescriptor | null {
        const order: RoleOrder = {
            dutyPriority: this._roleComponent.dutyPriority,
            permittedDutyCount: this._roleComponent.permittedDutyCount,
        };

        return rolePriorityView({
            order,
            selectedRole: this._selectedRole,
            onSelect: (role: WorkerRole) => {
                this._selectedRole = role;
            },
            onRaise: (role: WorkerRole) => {
                this.applyOrder(raiseRole(order, role));
            },
            onLower: (role: WorkerRole) => {
                this.applyOrder(lowerRole(order, role));
            },
            onClose: () => {
                this.context.stateChanger.pop();
            },
        });
    }

    private applyOrder(order: RoleOrder) {
        this.context.commandDispatcher(
            SetRolePriorityCommand(
                this._entity,
                order.dutyPriority,
                order.permittedDutyCount,
            ),
        );
    }
}
