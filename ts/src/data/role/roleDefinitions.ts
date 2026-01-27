import type { Sprite2 } from "../../asset/sprite.ts";
import { sprites2 } from "../../asset/sprite.ts";
import { WorkerRole } from "../../game/component/worker/roleComponent.ts";

export type RoleDefinition = {
    role: WorkerRole;
    name: string;
    subtitle: string;
    description: string;
    icon: Sprite2;
};

export const roleDefinitions: RoleDefinition[] = [
    {
        role: WorkerRole.Worker,
        name: "Worker",
        subtitle: "Labor & Production",
        description:
            "The backbone of any settlement. Workers keep the realm fed, housed, and functional through daily labor - baking, hauling, building, whatever needs doing. Their purpose is production, not conflict.",
        icon: sprites2.empty_sprite,
    },
    {
        role: WorkerRole.Explorer,
        name: "Explorer",
        subtitle: "Discovery & Mapping",
        description:
            "Venture beyond known boundaries into unmapped darkness. Explorers cycle expeditions, returning with discoveries, rumors, and tales. They reveal the world piece by piece - resources, ruins, threats.",
        icon: sprites2.empty_sprite,
    },
    {
        role: WorkerRole.Guard,
        name: "Guard",
        subtitle: "Security & Defense",
        description:
            "Sentinels who actively patrol designated areas, watching for threats. Guards provide security presence that deters crime and gives others confidence.",
        icon: sprites2.empty_sprite,
    },
    {
        role: WorkerRole.Devotee,
        name: "Devotee",
        subtitle: "Faith & Divine Favor",
        description:
            "Servants who tend temples and generate faith through ritual. Where workers produce bread and guards provide steel, devotees offer something older - divine favor that can bless or curse.",
        icon: sprites2.empty_sprite,
    },
    {
        role: WorkerRole.Spy,
        name: "Spy",
        subtitle: "Intelligence & Secrets",
        description:
            "Shadows who infiltrate other factions to steal secrets - their strength, plans, weaknesses. They might not return, or their capture could spark catastrophe.",
        icon: sprites2.empty_sprite,
    },
    {
        role: WorkerRole.Envoy,
        name: "Envoy",
        subtitle: "Diplomacy & Relations",
        description:
            "Your kingdom's face to the world. Envoys build relationships, forge alliances, and improve reputation. Where spies take secrets, envoys offer legitimacy.",
        icon: sprites2.empty_sprite,
    },
    {
        role: WorkerRole.Trader,
        name: "Trader",
        subtitle: "Commerce & Supply",
        description:
            "Merchants who maintain commerce between settlements, moving goods where needed - grain north, iron south. They're the economic arteries connecting distant places.",
        icon: sprites2.empty_sprite,
    },
];

export function getRoleDefinition(role: WorkerRole): RoleDefinition {
    return roleDefinitions.find((def) => def.role === role) ?? roleDefinitions[0];
}
