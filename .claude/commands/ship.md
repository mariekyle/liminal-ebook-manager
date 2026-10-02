---
description: Record a deploy: write the deploy record for the promoted version, hand Marie the docs commit block
---

Record a deploy. Every deploy step is Marie's: run no workflow and change no deployment.

1. Find the version from the most recent successful "Promote to stable" run. If gh is unavailable, ask Marie which version she promoted. If that version's changelog entry already has a deploy record, say so and stop.

2. Ask: did you run Update in TrueNAS Apps, and did the phone test pass?
   - Phone test failed: change no docs. Remind Marie that rollback is promote the previous tag, then Update. Stop.
   - Update not run yet: say so and stop.

3. Both yes:
   - In that version's entry in docs/CHANGELOG.md, replace any not-yet-tested line with a one-line deploy record: date promoted, updated, phone test passed. Edit that line only; no version bump, no new entry.
   - Update docs/PIPELINE.md wherever it names the live version.
   - Delete items in docs/OPEN_QUESTIONS.md only if Marie names them as resolved by the phone test.
   - Invoke the project-board skill: set the Liminal card's status line to the version and "live on stable". If the board update fails for any reason, end the report with "BOARD NOT UPDATED: <reason>".

4. Do not commit or push. Output one docs commit block in the fixed format, subject "docs: record X.Y.Z deployed and phone-tested <date>". No tag.

Report what changed in three lines.
