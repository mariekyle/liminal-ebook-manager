# Liminal Dev Vault
> This vault exists for one reason: **to separate thinking from building** so you can make progress on Liminal from anywhere, not just in front of your laptop.

---

## The Rules

1. **This vault has exactly 3 working notes.** That's it. Don't create new notes. If something doesn't fit in one of these three files, it either belongs in the Claude Project conversation, the ROADMAP, or nowhere.

2. **Decisions.md is append-only.** Never edit old entries. If a decision changes, add a new entry that supersedes it. The component reference table at the top is the one exception -- update it when components are built.

3. **Open Questions is your phone pickup list.** Grab a question, think it through in the Claude Project, then move the answer to Decisions.md and delete the question. This file should shrink over time.

4. **Pipeline.md is the "where am I + what do I paste next" file.** Open it at the start of any session. Macro roadmap, current sprint status, and a prompt queue at the bottom. When a decision unblocks a prompt, add it to Pipeline's prompt queue.

5. **If you feel the urge to create a new note, stop.** Ask yourself: does this go in Pipeline, Open Questions, or Decisions? The answer is always yes. If it genuinely doesn't fit, put it in the Claude Project conversation instead.

---

## The Workflow

> The phone generates decisions and prompts. The laptop consumes them. Neither blocks the other.

`📱` Check [[Pipeline]] -- where am I?
`📱` Grab a question from [[Open Questions]]
`📱` Think it through in the Claude Project. 
`📱` Log the decision -> [[Decisions]]
`📱` If the decisions warrants a prompt - talk through initial plan, but before prompt is written - ask claude to "before writing prompt, interview me to see if there are any gaps in my assumptions"
	- what is the core problem this solves? who is this for? what should success look like? what should this NOT do? After we work through these questions, summarize our updated findings, give me a list of updated decisions, then write the prompt for cursor
 -> add it to [[Pipeline]] prompt queue

**-- *starting a new sprint?* --**

`📱` Open a Claude Project chat: "I'm starting [phase]. What decisions do I need before I can write prompts?"
`📱` Log decisions -> [[Decisions]], add prompts -> [[Pipeline]] prompt queue
`📱` Not every phase needs pre-work. Some are one conversation and done.

**-- *sit down at the laptop* --**

`💻` Grab the next prompt from [[Pipeline]] prompt queue
`💻` Cursor implements -> review -> fix -> push
`💻` Update [[Pipeline]] status
`💻` New questions -> [[Open Questions]]

## How to push to git manually
1. **Finder first:** browse to the liminal folder on the NAS share like you normally would. If you can see it in Finder, it's mounted and Terminal can reach it. Leave that window open.
2. **Open Terminal from Spotlight:** Cmd+Space, type "Terminal", Enter. Ignore that it says your home folder. That's normal, not a problem to fix.
3. In Terminal, type `cd` — the letters c, d, then **one space**. Don't press Enter.
4. Drag the **liminal folder icon** from the Finder window onto the Terminal window. The path fills itself in — this is the entire trick; it exists so you never have to know what `/Volumes/whatever` the Mac mounted the share as.
5. **Now** press Enter.
6. Paste `git status` — if you see repo output instead of an error, you're standing in the right place. Proceed with the add/commit/push block.

---

## The Files

- [[Pipeline]] -- Where am I? What's next? What do I paste? (roadmap + sprint + prompt queue)
- [[Open Questions]] -- Things to think about (phone pickup list)
- [[Decisions]] -- Component reference + append-only decision log

---

## What Does NOT Go Here

- **Code** -- That's in the repo
- **Specs or PRDs** -- Claude Project conversation or the ROADMAP
- **General Liminal ideas** -- Claude Project conversation
- **Bug reports** -- ROADMAP.md or git issues
- **Documentation updates** (CHANGELOG, ROADMAP entries) -- Happen at session end during laptop phase, same git commit as the code
- **Future group decision queues** (C2-C8 questions) -- Claude Project conversation, pulled into Open Questions just-in-time
