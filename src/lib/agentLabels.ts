// Shared display helpers for the conversation's owning agent
// (administrative | commercial) — the two bot agents behind the single
// WhatsApp number (see CLAUDE.md §3.46 in the backend repo). Every place that
// used to show `channel` as the conversation's label now shows the agent
// instead; this is the single source for that label/color mapping so it is
// never duplicated across ConversationCard, ClientPanel, ChatPage, etc.
import type { ConversationAgent } from "../types";

export const AGENT_LABELS: Record<ConversationAgent, string> = {
  administrative: "Administrativo",
  commercial: "Comercial",
};

export const AGENT_STYLES: Record<ConversationAgent, string> = {
  administrative: "bg-success/15 text-success",
  commercial: "bg-brand-blue/15 text-brand-blue",
};

/**
 * Normalizes a possibly-missing/unknown agent value to a known
 * ConversationAgent. Falls back to "administrative" — the only agent that
 * existed before the dual-agent rollout, and the safest default for any
 * conversation payload that predates the `agent` field.
 */
export function resolveAgent(
  agent: string | null | undefined,
): ConversationAgent {
  return agent === "commercial" ? "commercial" : "administrative";
}

export function agentLabel(agent: string | null | undefined): string {
  return AGENT_LABELS[resolveAgent(agent)];
}

export function agentStyles(agent: string | null | undefined): string {
  return AGENT_STYLES[resolveAgent(agent)];
}
