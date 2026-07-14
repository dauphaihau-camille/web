# Agent Skills

This folder contains repository-specific instructions for coding agents.

Purpose:
- Keep project guidance portable across tools such as Codex, Claude, and similar agents.
- Store rules that should apply to any agent working in this repository.

How to use it:
- Read [`AGENTS.md`](../AGENTS.md) first.
- Follow the documents linked from `AGENTS.md`.
- Add new files here when the instruction is repo-specific and should be shared across agent tools.

Scope:
- `agent-skills/`: cross-agent repository guidance
- `.codex/`, `.claude/`, and similar folders: tool-specific configuration

Rule of thumb:
- Put shared repository conventions here.
- Put agent-vendor-specific behavior in that vendor's own folder.
