import type { GoapAgentComponent } from "../component/goapAgentComponent.ts";

/**
 * Priority levels for replan requests.
 * Higher values = more urgent = more likely to bypass cooldown.
 */
export const ReplanUrgency = {
    /** Low priority - respect cooldown (e.g., picked up item, minor state change) */
    Low: 0,

    /** Normal priority - respect cooldown (e.g., completed plan, goal satisfied) */
    Normal: 1,

    /** High priority - may bypass cooldown if enough time passed (e.g., new job available, hunger spike) */
    High: 2,

    /** Critical - always bypass cooldown (e.g., attacked, commanded, critical need) */
    Critical: 3,
} as const;

export type ReplanUrgency = (typeof ReplanUrgency)[keyof typeof ReplanUrgency];

/**
 * Request a replan for a GOAP agent.
 * @param agent The agent component
 * @param urgency How urgent the replan is
 * @param reason Debug string explaining why
 * @param currentTick Current simulation tick
 */
export function requestReplan(
    agent: GoapAgentComponent,
    urgency: ReplanUrgency,
    reason: string,
    currentTick: number,
): void {
    const timeSinceLastPlan = currentTick - agent.lastPlanTime;

    // Calculate effective cooldown based on context
    const effectiveCooldown = calculateDynamicCooldown(agent);

    // Determine if we should bypass cooldown
    const shouldBypass = shouldBypassCooldown(
        urgency,
        timeSinceLastPlan,
        effectiveCooldown,
    );

    if (shouldBypass) {
        agent.urgentReplanRequested = true;

        // Accumulate reasons if multiple urgent events occur
        if (agent.urgentReplanReason) {
            agent.urgentReplanReason += ` AND ${reason}`;
        } else {
            agent.urgentReplanReason = reason;
        }

        const urgencyName = Object.entries(ReplanUrgency).find(
            ([_, val]) => val === urgency,
        )?.[0];
        console.log(
            `[GOAP] Agent urgent replan: ${reason} (urgency=${urgencyName}, bypassed ${effectiveCooldown - timeSinceLastPlan} tick cooldown)`,
        );
    } else {
        // Respect cooldown, replan will happen naturally when cooldown expires
        console.log(
            `[GOAP] Agent replan queued: ${reason} (${effectiveCooldown - timeSinceLastPlan} ticks until cooldown expires)`,
        );
    }
}

/**
 * Determine if cooldown should be bypassed based on urgency and time elapsed.
 */
function shouldBypassCooldown(
    urgency: ReplanUrgency,
    timeSinceLastPlan: number,
    cooldown: number,
): boolean {
    switch (urgency) {
        case ReplanUrgency.Critical:
            return true; // Always bypass

        case ReplanUrgency.High:
            // Bypass if we're at least halfway through cooldown
            return timeSinceLastPlan >= cooldown * 0.5;

        case ReplanUrgency.Normal:
        case ReplanUrgency.Low:
            return false; // Never bypass
    }
}

/**
 * Calculate dynamic cooldown based on agent's current context.
 * This is a performance optimization - it doesn't affect gameplay directly.
 */
export function calculateDynamicCooldown(agent: GoapAgentComponent): number {
    // If agent has no plan, use short cooldown (they're idle, might need to act soon)
    if (!agent.currentPlan) {
        return 5;
    }

    // If last action failed, retry sooner
    if (agent.lastActionFailed) {
        return 3;
    }

    // If plan completed successfully, longer cooldown (agent can rest)
    if (agent.currentStepIndex >= agent.currentPlan.steps.length) {
        return 30;
    }

    // Default: medium cooldown (mid-plan interruption)
    return 15;
}
