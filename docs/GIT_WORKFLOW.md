# Git Workflow for Liminal Development

This guide explains how to use Git + GitHub alongside Cursor AI to keep your codebase safe and recoverable.

---

## Why Git Matters (Especially with AI-Assisted Development)

When you're working with Cursor or any AI tool, changes can happen fast - sometimes faster than you can fully review them. Git gives you:

1. **Undo button** - Made a mistake? Roll back to any previous state
2. **Checkpoints** - Save working versions before experimenting
3. **History** - See exactly what changed and when
4. **Backup** - Your code lives on GitHub, not just your computer

---

## Initial Setup (One Time)

### 1. Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in (or create account)
2. Click the **+** in the top right → **New repository**
3. Name it `liminal` (or `liminal-ebook-manager`)
4. Choose **Private** (unless you want it public)
5. DON'T add README, .gitignore, or license (we'll push our existing code)
6. Click **Create repository**

### 2. Initialize Git in Your Project

Open terminal in your `liminal` project folder:

```bash
# Navigate to your project
cd /path/to/liminal

# Initialize git
git init

# Create a .gitignore file (important!)
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Build outputs
frontend/dist/
*.egg-info/

# Local data (don't commit your database!)
data/
*.db

# Environment files (may contain secrets)
.env
.env.local

# IDE
.idea/
.vscode/
*.swp

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
EOF

# Add all files
git add .

# First commit
git commit -m "Initial commit: Liminal v0.1.0 skeleton"

# Connect to GitHub (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/liminal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## The Golden Rule: Commit Before Cursor Changes Things

**Before asking Cursor to make significant changes:**

```bash
git add .
git commit -m "Checkpoint: working state before [what you're about to try]"
```

This takes 5 seconds and can save hours of pain.

---

## Daily Workflow

### Starting a Work Session

```bash
# Make sure you're on main branch
git checkout main

# Pull any changes (if you work from multiple computers)
git pull
```

### While Working with Cursor

**Small changes** (fixing a bug, tweaking styles):
- Just work normally
- Commit when you have something working

**Bigger changes** (new feature, refactoring):
1. Create a branch first:
   ```bash
   git checkout -b feature/notes-linking
   ```
2. Work with Cursor on that branch
3. If it works → merge to main
4. If it breaks → abandon the branch, go back to main

### After Getting Something Working

```bash
# See what changed
git status

# Review changes (optional but good practice)
git diff

# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Add: [[link]] parsing in notes"

# Push to GitHub
git push
```

---

## Commit Message Convention

Use prefixes to make history scannable:

```
Add: new feature or file
Fix: bug fix
Update: improvement to existing feature
Refactor: code reorganization (no behavior change)
Style: formatting, CSS changes
Docs: documentation updates
WIP: work in progress (not finished yet)
```

Examples:
```
Add: book search with debouncing
Fix: sync crash on empty folders
Update: improve mobile grid layout
Refactor: extract metadata parsing to service
Docs: update architecture with linking explanation
```

---

## Recovery Scenarios

### "Cursor broke something and I don't know what"

```bash
# See what files changed
git status

# See the actual changes
git diff

# Undo ALL uncommitted changes (nuclear option)
git checkout .

# Or undo just one file
git checkout -- path/to/file.js
```

### "I committed but it's broken"

```bash
# Go back one commit but keep changes as uncommitted
git reset --soft HEAD~1

# Or go back one commit and discard those changes entirely
git reset --hard HEAD~1
```

### "I need to go back to yesterday's version"

```bash
# See commit history
git log --oneline

# Output looks like:
# a1b2c3d Add: notes linking
# e4f5g6h Fix: sync crash
# i7j8k9l Add: book detail page   <-- want this one

# Check out that specific commit to look at it
git checkout i7j8k9l

# If you want to STAY at that version, create a branch
git checkout -b recovery-branch
```

### "I want to see what the code looked like before Cursor changed it"

```bash
# Compare current file to last commit
git diff HEAD -- path/to/file.js

# Compare to a specific commit
git diff i7j8k9l -- path/to/file.js
```

---

## Branching Strategy (Recommended)

Keep `main` always working. Experiment on branches.

```
main (always deployable)
 │
 ├── feature/notes-editor     (working on notes)
 ├── feature/mobile-layout    (working on mobile)
 └── experiment/new-cover-gen (trying something risky)
```

### Create a branch
```bash
git checkout -b feature/my-feature
```

### Switch branches
```bash
git checkout main
git checkout feature/my-feature
```

### Merge a branch into main (when it works)
```bash
git checkout main
git merge feature/my-feature
git push
```

### Delete a branch (when done or abandoning)
```bash
git branch -d feature/my-feature
```

---

## Cursor-Specific Tips

### Before Asking Cursor for Big Changes

1. Commit your current state
2. Maybe create a branch
3. Then ask Cursor

### After Cursor Makes Changes

1. **Review the diff** before committing:
   ```bash
   git diff
   ```
2. Test that it works
3. Then commit

### If Cursor Deletes Something It Shouldn't

Remember your Development Guidelines! But if it happens:

```bash
# See what was deleted
git diff

# Restore just that file from last commit
git checkout HEAD -- path/to/deleted/file.js
```

### Cursor's Composer Mode (Multi-file Changes)

Composer can change many files at once. Extra caution:

1. Always commit before using Composer
2. Review the diff carefully after
3. Consider using a branch for Composer experiments

---

## GitHub as Backup

Your code is automatically backed up every time you `git push`. 

If your computer dies:
1. Get new computer
2. Install Git
3. Clone your repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/liminal.git
   ```
4. You're back in business

---

## Quick Reference Card

```bash
# Save current work
git add . && git commit -m "message"

# Push to GitHub
git push

# Undo uncommitted changes
git checkout .

# Go back one commit
git reset --hard HEAD~1

# See what changed
git status
git diff

# Create branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# See history
git log --oneline
```

---

## Setting Up Git in Cursor

Cursor has built-in Git support:

1. **Source Control panel** (left sidebar, branch icon)
   - Shows changed files
   - Lets you stage and commit
   - Shows diff when you click a file

2. **Bottom status bar**
   - Shows current branch
   - Click to switch branches

3. **Command Palette** (Cmd/Ctrl + Shift + P)
   - Type "git" to see all git commands

You can use either the UI or terminal - whatever feels more natural.

---

## Tagging Releases

When you hit a milestone, tag it:

```bash
git tag -a v0.1.0 -m "Initial skeleton"
git push origin v0.1.0
```

Later you can always go back:
```bash
git checkout v0.1.0
```

Suggested tags:
- `v0.1.0` - Initial skeleton (now!)
- `v0.2.0` - Library view working
- `v0.3.0` - Notes working
- `v0.4.0` - Linking working
- `v1.0.0` - First "complete" version

---

## Summary

The key habits to build:

1. **Commit early, commit often** - small commits are easier to understand and revert
2. **Commit before Cursor experiments** - give yourself an undo point
3. **Push daily** - backs up to GitHub
4. **Use branches for experiments** - keeps main safe
5. **Write meaningful commit messages** - future you will thank present you

Git feels like overhead at first, but it becomes muscle memory quickly. And the first time it saves you from losing work, you'll be grateful.
