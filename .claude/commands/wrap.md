---
description: End of session: verify, review, update the record, hand Marie the commit block
---

End of a session, following "Session end" in CLAUDE.md. This command fixes the order and the output; CLAUDE.md is the rule.

If the session changed code:
1. Run the verification rule. If it fails, report the failure and stop.
2. Run the code-reviewer agent's three checks. Stop and report if it finds a frozen-file edit or scope drift.
3. If frontend/src was touched, include the design lint category summary in the report.

Then, for every session:
4. Update the record in the same change:
   - Changelog. If Marie has said this change ships: bump version= in backend/main.py and head a new top entry with it. If it does not ship yet: add it under ## [Unreleased]. If you do not know which, ask before writing. Docs-only: follow the docs-only rule in CLAUDE.md; without a bump there is no entry.
   - docs/DECISIONS.md: entries for anything Marie ratified this session, moved below the line.
   - docs/OPEN_QUESTIONS.md: triage; delete resolved items.
   - docs/PIPELINE.md: only where a queue item moved.
   - docs/ROADMAP.md, docs/ARCHITECTURE.md, docs/CODE_PATTERNS.md: only where the state they describe changed.
5. Invoke the project-board skill: set the Liminal card's status line to "X.Y.Z committed, awaiting tag" if the change ships, or "docs only, no build" if it does not. If the board update fails for any reason, end the report with "BOARD NOT UPDATED: <reason>".
6. Do not commit or push. Output one commit block in the fixed format. If the change ships, output the tag block after it; otherwise say "No tag."

Report what changed and what was verified unchanged. End with one line per item pending ratification and the words "Not live until tagged, published, promoted and updated."
