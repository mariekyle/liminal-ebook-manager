---
description: Session start: triage the Inbox, report the queue and pending ratification, then wait for a step
allowed-tools: Bash(git status:*), Bash(git log:*), Read, Edit
---

Start the session, following "Session start" in CLAUDE.md. Do not build, edit app code, or commit anything.

1. Re-read CLAUDE.md in full. Read docs/PIPELINE.md, docs/OPEN_QUESTIONS.md, the "Pending ratification" section of docs/DECISIONS.md, and the top entry of docs/CHANGELOG.md. Do not read the design docs now; CLAUDE.md requires them before any UI work, not at session start.

2. Triage everything under # INBOX in docs/OPEN_QUESTIONS.md into the backlog with a priority, then clear the Inbox. Write nothing else under # INBOX. If it is empty, change nothing. Touch no other file; the triage rides along with the next commit.

3. Report exactly this, in this order, and nothing else:
   - Now: the top of the current queue in docs/PIPELINE.md, the version of record (version= in backend/main.py) and the top heading of docs/CHANGELOG.md. If the two versions differ, say so.
   - Pending ratification: every item under that heading in docs/DECISIONS.md, one line each, or "Nothing pending."
   - Working tree: uncommitted or unpushed changes, one line each, or "Clean."

If the Inbox had items, add one line before the report saying how many were triaged.

End with the words "Waiting for a step." and stop. Do not start, plan or propose any step until Marie names one.
