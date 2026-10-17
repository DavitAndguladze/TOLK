# Pre-generate Leveled Pages; adapt only between Pages

Status: superseded by ADR-0008 (2026-10-17)

Every Page of a Story is rewritten at all 5 Levels by OCI GenAI before reading starts, and the Reader's Level only changes at a Page boundary. Live LLM rewriting mid-read would add latency and shift text under a reader's eyes while they speak it; pre-generation makes swaps instant and lets us lock plot and names with a review pass. Cost: storage of 5× text per Story, and Practice Words (per-Reader) can't be fully pre-generated (see open questions).
