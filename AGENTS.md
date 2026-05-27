# AGENTS.md — Rage Slice

Project context for Codex. Build instructions live in `CODEX_BUILD_SPEC.md`;
design source of truth is `DESIGN.md`.

## Parallel sub-agents: READ-ONLY ONLY (hard policy)

When using the multi-agent / `spawn_agent` capability in this repo, **sub-agents
are for read-only work exclusively.** This overrides any default preference to
delegate write/patch subtasks.

**Sub-agents MAY:** read files, search/grep, trace code, analyze architecture,
run read-only inspections, forward-test/dry-run, draft review notes, and report
findings back to the main agent.

**Sub-agents MUST NOT:** edit, create, move, or delete files; apply patches; run
build/install/format/codegen or any command with side effects; make network
calls that mutate state; or git write operations (add/commit/push/checkout).

**All writes happen only in the main (root) agent**, after it integrates the
sub-agents' read-only findings. If a task requires a write, the main agent does
it directly — do not delegate it to a sub-agent.

Parallelize read-only exploration freely (independent scopes), then consolidate
and let the single main agent perform the edits.

## Why

Keeps a single, reviewable write path (one agent, guardian-reviewed) while still
getting parallel speed on the safe, read-only parts of the work. Avoids
overlapping/conflicting edits from concurrent agents.
