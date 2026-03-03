"""
Simple global resolver that routes between ASK / INTERACT / DRAFT
based on entities and BIOES tags from the legal NER model.

Focus (v1): good routing for ASK.
"""

from dataclasses import dataclass
from typing import List, Literal, Optional


AgentType = Literal["ASK", "INTERACT", "DRAFT"]


@dataclass
class ResolutionResult:
    agent: AgentType
    reason: str


def _lower(text: str) -> str:
    return text.lower() if text else ""


def resolve_agent(
    query: str,
    entities: List[object],  # expects objects with .label and .text
    bioes_tags: List[dict],
) -> ResolutionResult:
    """
    Very simple rule-based resolver.

    Priority:
      1. DRAFT if strong drafting/doctype signal
      2. ASK if strong research/provision/statute signal
      3. INTERACT otherwise (default)
    """
    q = _lower(query)

    # --- Heuristic signals -------------------------------------------------
    labels = {getattr(e, "label", None) for e in entities}

    has_provision = "PROVISION" in labels
    has_statute = "STATUTE" in labels
    has_precedent = "PRECEDENT" in labels
    has_court = "COURT" in labels
    has_case_number = "CASE_NUMBER" in labels

    # Drafting keywords (even though DOCTYPE is not in model, we can still use text)
    draft_keywords = [
        "draft ",  # leading space to avoid "drafted"
        "prepare ",
        "format ",
        "legal notice",
        "plaint",
        "affidavit",
        "bail application",
        "rti application",
        "complaint",
        "petition",
    ]
    has_draft_keyword = any(kw in q for kw in draft_keywords)

    # Document / file interaction keywords
    interact_keywords = [
        "upload",
        "uploaded",
        "attached",
        "this document",
        "above document",
        "clause",
        "para ",
        "paragraph",
        "highlighted",
        "pdf",
        "docx",
    ]
    has_interact_keyword = any(kw in q for kw in interact_keywords)

    # Research / explanation keywords
    ask_keywords = [
        "what is",
        "explain",
        "meaning of",
        "interpret",
        "how does",
        "case law",
        "judgment",
        "precedent",
    ]
    has_ask_keyword = any(kw in q for kw in ask_keywords)

    # --- Scoring -----------------------------------------------------------
    score_ask = 0
    score_draft = 0
    score_interact = 0

    # Entity-based signals
    if has_provision:
        score_ask += 3
    if has_statute:
        score_ask += 2
    if has_precedent:
        score_ask += 2
    if has_court or has_case_number:
        score_ask += 1

    # Keyword-based signals
    if has_ask_keyword:
        score_ask += 2

    if has_draft_keyword:
        score_draft += 3

    if has_interact_keyword:
        score_interact += 2

    # Fallback: if no entities at all, prefer ASK for legal questions
    if not entities:
        score_ask += 1

    # --- Decide agent ------------------------------------------------------
    scores = {
        "ASK": score_ask,
        "DRAFT": score_draft,
        "INTERACT": score_interact,
    }

    # Choose agent with highest score; tie-breaker: ASK > DRAFT > INTERACT
    ordered = sorted(
        scores.items(),
        key=lambda kv: (-kv[1], ["ASK", "DRAFT", "INTERACT"].index(kv[0])),
    )
    chosen_agent, chosen_score = ordered[0]

    # Build a short reason string (mainly for debugging/logging)
    reason_parts: List[str] = []
    if chosen_agent == "ASK":
        if has_provision:
            reason_parts.append("has PROVISION")
        if has_statute:
            reason_parts.append("has STATUTE")
        if has_precedent:
            reason_parts.append("has PRECEDENT")
        if has_ask_keyword:
            reason_parts.append("has ASK keywords")
        if not entities:
            reason_parts.append("no entities detected (fallback to ASK)")
    elif chosen_agent == "DRAFT":
        if has_draft_keyword:
            reason_parts.append("has drafting/doctype keywords")
    elif chosen_agent == "INTERACT":
        if has_interact_keyword:
            reason_parts.append("has document/interact keywords")

    if not reason_parts:
        reason_parts.append("default rule")

    reason = f"agent={chosen_agent}, score={chosen_score}, signals={', '.join(reason_parts)}"
    return ResolutionResult(agent=chosen_agent, reason=reason)

