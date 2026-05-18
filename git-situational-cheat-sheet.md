---
title: "Git Situational Cheat Sheet"
description: "A practical, problem-first Git command reference for real development situations."
version: "1.0.0"
last_updated: "2026-05-19"
author: "Generated with ChatGPT"
tags:
  - git
  - version-control
  - cheat-sheet
  - developer-tools
---

# Git Situational Cheat Sheet

A practical, **situation-first** Git reference.

Most Git cheat sheets start with commands.  
This one starts with the problem:

> “I am in this situation. What should I run?”

---

## Danger Legend

| Label | Meaning |
|---|---|
| 🟢 Safe | Read-only or low-risk command. Usually does not change your repository. |
| 🟡 Moderate | Changes staging, branches, or working files, but usually recoverable. |
| 🟠 Risky | Can remove work or create confusing history if used carelessly. |
| 🔴 Destructive | Can delete local changes, untracked files, or commits. Use carefully. |
| 🟣 Rewrites History | Changes commit history. Avoid on shared branches unless you know what you are doing. |

---

## Before Running Dangerous Commands

Before using commands like `reset --hard`, `clean -fd`, `rebase`, or force push, run:

```bash
git status
git diff
git diff --staged
git log --oneline --graph --decorate -10
```

If you are not sure whether you may need your current work later, create a safety branch first:

```bash
git branch safety-backup
```

Or stash your work:

```bash
git stash push -u -m "backup before risky operation"
```

---

## Emergency Rule

If you think you lost work, do **not panic**. Start with:

```bash
git reflog
```

`git reflog` often lets you recover commits, branch movements, bad resets, and failed rebases.

---

# 1. Inspection and Diagnosis

Use these commands when you want to understand the current state before changing anything.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| See current branch and file changes | `git status` | 🟢 | The first command to run when confused. |
| See unstaged changes | `git diff` | 🟢 | Shows changes not yet staged. |
| See staged changes | `git diff --staged` | 🟢 | Shows what will go into the next commit. |
| See recent commits | `git log --oneline` | 🟢 | Compact commit history. |
| See branch graph | `git log --oneline --graph --all --decorate` | 🟢 | Useful for branch/merge understanding. |
| See changes in one file | `git diff file.txt` | 🟢 | Limits diff to one file. |
| See who changed each line | `git blame file.txt` | 🟢 | Useful for debugging history. |
| Show current branch only | `git branch --show-current` | 🟢 | Good for scripts and prompts. |
| Show ignored files too | `git status --ignored` | 🟢 | Useful when `.gitignore` is confusing. |

## Recipe: “I do not know what is going on”

```bash
git status
git log --oneline --graph --all --decorate -10
git diff
git diff --staged
```

**Use when:** You are unsure whether changes are staged, committed, pushed, or lost.

---

# 2. Discarding Local Changes

Use these when you want to throw away work in your working directory.

> [!CAUTION]
> These commands can permanently delete local work. Run `git status` and `git diff` first.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Discard changes in one tracked file | `git restore file.txt` | 🔴 | Restores file from `HEAD`. |
| Discard all unstaged tracked changes | `git restore .` | 🔴 | Does not remove untracked files. |
| Discard staged and unstaged tracked changes | `git reset --hard` | 🔴 | Resets tracked files to `HEAD`. |
| Remove untracked files and folders | `git clean -fd` | 🔴 | Deletes files Git does not track. |
| Preview what `clean` would delete | `git clean -fdn` | 🟢 | Always run this before `git clean -fd`. |
| Remove untracked and ignored files | `git clean -fdx` | 🔴 | Very aggressive. Deletes ignored files too. |

## Recipe: “I want to fully return to the last commit”

```bash
git reset --hard
git clean -fd
```

**Use when:** You want your working tree to match the latest commit exactly, except ignored files.

## Recipe: “I want the most aggressive cleanup”

```bash
git reset --hard
git clean -fdx
```

**Use when:** You also want to remove ignored build artifacts, cache files, and local generated files.

**Warning:** This can delete `.env`, local databases, build outputs, and ignored files.

---

# 3. Fixing the Staging Area

Use these when you added files to staging by mistake.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Unstage one file | `git restore --staged file.txt` | 🟡 | Keeps file changes. |
| Unstage everything | `git restore --staged .` | 🟡 | Keeps working directory changes. |
| Older style: unstage one file | `git reset file.txt` | 🟡 | Common in older tutorials. |
| Older style: unstage all | `git reset` | 🟡 | Keeps changes in working tree. |

## Recipe: “I accidentally ran `git add .`”

```bash
git restore --staged .
```

**Use when:** You want to keep your changes but remove them from the next commit.

---

# 4. Creating Commits

Use these for normal commit workflows.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Stage one file | `git add file.txt` | 🟡 | Adds file to next commit. |
| Stage all changed tracked files | `git add -u` | 🟡 | Does not add new untracked files. |
| Stage all changes | `git add .` | 🟡 | Adds modified, deleted, and new files. |
| Stage parts of a file | `git add -p` | 🟡 | Excellent for clean commits. |
| Commit staged changes | `git commit -m "Message"` | 🟡 | Creates a new commit. |
| Commit with longer message | `git commit` | 🟡 | Opens editor. |

## Recipe: “I want a clean commit”

```bash
git status
git diff
git add -p
git diff --staged
git commit
```

**Use when:** You want to review every change before committing.

---

# 5. Fixing the Last Commit

Use these when the latest commit is wrong.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Change last commit message | `git commit --amend -m "New message"` | 🟣 | Rewrites last commit. |
| Add forgotten files to last commit | `git add . && git commit --amend --no-edit` | 🟣 | Rewrites last commit. |
| Edit last commit interactively | `git commit --amend` | 🟣 | Opens editor. |
| Undo last commit but keep changes staged | `git reset --soft HEAD~1` | 🟣 | Useful for recommitting. |
| Undo last commit and keep changes unstaged | `git reset HEAD~1` | 🟣 | Mixed reset. |
| Undo last commit and delete changes | `git reset --hard HEAD~1` | 🔴 🟣 | Destructive. |

## Recipe: “I forgot to include a file in my last commit”

```bash
git add forgotten-file.txt
git commit --amend --no-edit
```

**Use when:** The commit has not been pushed, or you are sure rewriting it is acceptable.

## Recipe: “I committed too early”

```bash
git reset --soft HEAD~1
```

**Use when:** You want to undo the commit but keep everything staged.

---

# 6. Safely Undoing Commits

Use `git revert` when you want to undo a commit without rewriting history.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Revert latest commit | `git revert HEAD` | 🟡 | Creates a new undo commit. |
| Revert a specific commit | `git revert commit_hash` | 🟡 | Safe for shared branches. |
| Revert multiple commits | `git revert commit1 commit2` | 🟡 | Reverts each commit. |
| Revert a range | `git revert older_hash..newer_hash` | 🟡 | Be careful with range direction. |
| Revert without committing immediately | `git revert --no-commit commit_hash` | 🟡 | Lets you review first. |

## Recipe: “I pushed a bad commit and need to undo it safely”

```bash
git revert commit_hash
git push
```

**Use when:** Other people may already have pulled the bad commit.

---

# 7. Returning to Older Versions

Use these when you want to inspect or restore older code.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Inspect old commit temporarily | `git checkout commit_hash` | 🟡 | Enters detached HEAD state. |
| Return to branch | `git switch main` | 🟡 | Leaves detached state. |
| Reset branch to old commit | `git reset --hard commit_hash` | 🔴 🟣 | Moves branch pointer and deletes local changes. |
| Restore one file from old commit | `git restore --source commit_hash file.txt` | 🟠 | Replaces current file content. |
| Restore one file from previous commit | `git restore --source HEAD~1 file.txt` | 🟠 | Useful for file-level rollback. |

## Recipe: “I only want one old file back”

```bash
git restore --source commit_hash path/to/file.txt
```

**Use when:** You do not want to reset the whole branch.

---

# 8. Recovering Deleted or Lost Work

Use these when a file, branch, or commit seems gone.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Restore deleted tracked file | `git restore file.txt` | 🟡 | Works if deletion is not committed. |
| Find history of a file | `git log -- file.txt` | 🟢 | Shows commits affecting a file. |
| Restore deleted file from old commit | `git restore --source commit_hash file.txt` | 🟠 | Good for committed deletions. |
| See HEAD movement history | `git reflog` | 🟢 | Best recovery tool. |
| Create branch from recovered commit | `git branch recovered-work commit_hash` | 🟡 | Safe way to save lost work. |
| Check out recovered commit | `git checkout commit_hash` | 🟡 | Inspect before restoring. |

## Recipe: “I reset and lost commits”

```bash
git reflog
git branch recovered-work HEAD@{2}
```

**Use when:** You see the lost commit in `git reflog`.

## Recipe: “I deleted a file several commits ago”

```bash
git log -- path/to/file.txt
git restore --source commit_hash path/to/file.txt
```

---

# 9. Emergency Recovery with Reflog

`git reflog` records where your branch and `HEAD` have been.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Show previous HEAD positions | `git reflog` | 🟢 | Start here after mistakes. |
| Return to previous HEAD state | `git reset --hard HEAD@{1}` | 🔴 🟣 | Restores old state but deletes current local changes. |
| Create safety branch from previous state | `git branch rescue HEAD@{1}` | 🟡 | Safer than resetting immediately. |
| Recover from bad rebase | `git reflog` then `git reset --hard HEAD@{n}` | 🔴 🟣 | Pick the state before rebase. |

## Safer Recovery Pattern

```bash
git reflog
git branch rescue HEAD@{n}
git switch rescue
```

**Use when:** You want to inspect recovered work before changing your current branch.

---

# 10. Temporarily Saving Work with Stash

Use stash when you need a clean working tree but are not ready to commit.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Save tracked changes | `git stash` | 🟡 | Does not include untracked files by default. |
| Save with message | `git stash push -m "message"` | 🟡 | Easier to identify later. |
| Save including untracked files | `git stash -u` | 🟡 | Very useful. |
| List stashes | `git stash list` | 🟢 | Shows saved stashes. |
| Apply latest stash but keep it | `git stash apply` | 🟡 | Stash remains in list. |
| Apply latest stash and remove it | `git stash pop` | 🟠 | Can conflict. |
| Apply specific stash | `git stash apply stash@{2}` | 🟡 | Good when multiple stashes exist. |
| Delete a stash | `git stash drop stash@{0}` | 🔴 | Deletes that stash. |
| Delete all stashes | `git stash clear` | 🔴 | Deletes all stashed work. |

## Recipe: “I need to switch branches but I have unfinished work”

```bash
git stash push -u -m "work in progress"
git switch other-branch
```

Later:

```bash
git stash pop
```

---

# 11. Branch Management

Use these when creating, switching, renaming, or deleting branches.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| List local branches | `git branch` | 🟢 | Current branch has `*`. |
| List all branches | `git branch -a` | 🟢 | Includes remote-tracking branches. |
| Create branch | `git branch feature-name` | 🟡 | Does not switch to it. |
| Switch branch | `git switch feature-name` | 🟡 | Modern alternative to checkout. |
| Create and switch | `git switch -c feature-name` | 🟡 | Common feature workflow. |
| Rename current branch | `git branch -m new-name` | 🟡 | Local rename only. |
| Delete merged local branch | `git branch -d branch-name` | 🟡 | Refuses if unmerged. |
| Force delete local branch | `git branch -D branch-name` | 🔴 | Deletes even if unmerged. |

## Recipe: “I want to start a new feature”

```bash
git switch main
git pull
git switch -c feature/my-feature
```

---

# 12. Moving Work Between Branches

Use these when you started work on the wrong branch.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Move uncommitted work to another branch | `git stash -u`, switch branch, `git stash pop` | 🟠 | May create conflicts. |
| Create new branch from current state | `git switch -c new-branch` | 🟡 | Good if work is not committed yet. |
| Move latest commit to new branch | `git branch new-branch` then `git reset --hard HEAD~1` | 🔴 🟣 | Removes commit from current branch. |
| Copy one commit to another branch | `git cherry-pick commit_hash` | 🟠 | Can conflict. |

## Recipe: “I made changes on the wrong branch but have not committed”

```bash
git stash push -u -m "move work to correct branch"
git switch correct-branch
git stash pop
```

## Recipe: “I committed on the wrong branch”

```bash
git branch correct-branch
git reset --hard HEAD~1
git switch correct-branch
```

**Use when:** The accidental commit should move to a new branch and be removed from the current one.

---

# 13. Merging and Conflict Resolution

Use these when combining branches.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Merge another branch into current branch | `git merge branch-name` | 🟠 | Can create conflicts. |
| Abort failed merge | `git merge --abort` | 🟠 | Returns to pre-merge state if possible. |
| See conflicted files | `git status` | 🟢 | Conflicted files are clearly listed. |
| Accept our version of a conflicted file | `git checkout --ours file.txt` | 🟠 | Keeps current branch version. |
| Accept their version of a conflicted file | `git checkout --theirs file.txt` | 🟠 | Keeps merged branch version. |
| Continue after resolving conflicts | `git add . && git commit` | 🟡 | Completes merge. |

## Recipe: “A merge went wrong and I want to cancel it”

```bash
git merge --abort
```

## Recipe: “I resolved conflicts and want to finish the merge”

```bash
git status
git add .
git commit
```

---

# 14. Rebasing and Cleaning Commit History

Use rebase when you want a cleaner, linear history.

> [!WARNING]
> Rebasing rewrites history. Avoid rebasing commits that other people already use.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Rebase current branch onto main | `git rebase main` | 🟣 | Replays commits on top of main. |
| Abort rebase | `git rebase --abort` | 🟠 | Returns to pre-rebase state. |
| Continue after conflict resolution | `git rebase --continue` | 🟠 | Run after `git add`. |
| Skip problematic commit | `git rebase --skip` | 🟠 | Drops current commit from rebase. |
| Edit last 3 commits | `git rebase -i HEAD~3` | 🟣 | Squash, reorder, edit, reword. |
| Squash branch into one commit | `git reset --soft main && git commit` | 🟣 | Useful before pull request. |

## Recipe: “I want to squash my last 3 commits”

```bash
git rebase -i HEAD~3
```

Then change `pick` to `squash` or `fixup` for commits you want to combine.

---

# 15. Working with Remote Repositories

Use these when interacting with GitHub, GitLab, Bitbucket, or another remote.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| See remotes | `git remote -v` | 🟢 | Shows fetch/push URLs. |
| Add remote | `git remote add origin URL` | 🟡 | Common after `git init`. |
| Change remote URL | `git remote set-url origin URL` | 🟡 | Useful after repo rename. |
| Fetch remote changes | `git fetch` | 🟢 | Downloads metadata; does not merge. |
| Pull latest changes | `git pull` | 🟠 | Fetches and merges/rebases. |
| Push current branch | `git push` | 🟡 | Sends commits to remote. |
| Push and set upstream | `git push -u origin branch-name` | 🟡 | First push of new branch. |
| Delete remote branch | `git push origin --delete branch-name` | 🔴 | Deletes branch on remote. |

## Recipe: “I created a local repo and want to push it to GitHub”

```bash
git remote add origin URL
git branch -M main
git push -u origin main
```

---

# 16. Syncing with Remote Branches

Use these when your local branch is behind, ahead, or diverged.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Fetch latest remote state | `git fetch` | 🟢 | Safe first step. |
| See commits remote has and you do not | `git log --oneline HEAD..origin/main` | 🟢 | Shows incoming commits. |
| See commits you have and remote does not | `git log --oneline origin/main..HEAD` | 🟢 | Shows outgoing commits. |
| Pull with merge | `git pull` | 🟠 | May create merge commit. |
| Pull with rebase | `git pull --rebase` | 🟣 | Rewrites local commits. |
| Make local branch exactly match remote | `git reset --hard origin/main` | 🔴 🟣 | Deletes local-only commits and changes. |

## Recipe: “I want my local branch to exactly match GitHub”

```bash
git fetch
git reset --hard origin/main
```

**Use when:** You do not care about local-only commits or changes.

---

# 17. Fixing Pushed Mistakes

Use these when a mistake has already reached the remote.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Undo pushed commit safely | `git revert commit_hash` | 🟡 | Best for shared branches. |
| Amend latest pushed commit | `git commit --amend` | 🟣 | Requires force push. |
| Push rewritten history safely | `git push --force-with-lease` | 🟣 | Safer than `--force`. |
| Reset branch and update remote | `git reset --hard commit_hash` then `git push --force-with-lease` | 🔴 🟣 | Dangerous on shared branches. |

## Recipe: “I pushed a commit with a typo in the message”

```bash
git commit --amend -m "Correct message"
git push --force-with-lease
```

## Recipe: “I pushed a bad commit to a shared branch”

```bash
git revert commit_hash
git push
```

**Recommendation:** Prefer `revert` on shared branches.

---

# 18. Copying Commits Between Branches

Use cherry-pick when you want one commit without merging the whole branch.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Apply one commit to current branch | `git cherry-pick commit_hash` | 🟠 | Can conflict. |
| Apply commit without committing | `git cherry-pick --no-commit commit_hash` | 🟠 | Lets you inspect/edit first. |
| Abort cherry-pick | `git cherry-pick --abort` | 🟠 | Cancels operation. |
| Continue after conflict | `git cherry-pick --continue` | 🟠 | Run after resolving and staging. |

## Recipe: “I need one bug fix from another branch”

```bash
git switch target-branch
git cherry-pick commit_hash
```

---

# 19. Comparing Changes

Use these to compare files, commits, and branches.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Compare working tree with last commit | `git diff` | 🟢 | Unstaged changes. |
| Compare staged changes | `git diff --staged` | 🟢 | Next commit preview. |
| Compare two branches | `git diff main feature` | 🟢 | Shows content differences. |
| Compare two commits | `git diff commit1 commit2` | 🟢 | Direct commit comparison. |
| Show one commit | `git show commit_hash` | 🟢 | Shows metadata and patch. |
| Show files changed in commit | `git show --name-only commit_hash` | 🟢 | File list only. |
| See commits in feature not in main | `git log main..feature` | 🟢 | Useful before PR. |
| See commits in main not in feature | `git log feature..main` | 🟢 | Shows what feature lacks. |

## Recipe: “What will my pull request contain?”

```bash
git fetch
git log --oneline origin/main..HEAD
git diff origin/main...HEAD
```

---

# 20. Finding the Commit That Broke Something

Use `git bisect` for binary search through history.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Start bisect | `git bisect start` | 🟡 | Begins search mode. |
| Mark current commit as bad | `git bisect bad` | 🟡 | Current version has bug. |
| Mark known good commit | `git bisect good commit_hash` | 🟡 | Git starts binary search. |
| Mark tested commit as good | `git bisect good` | 🟡 | Continue search. |
| Mark tested commit as bad | `git bisect bad` | 🟡 | Continue search. |
| End bisect | `git bisect reset` | 🟡 | Returns to original branch. |

## Recipe: “This used to work, but now it is broken”

```bash
git bisect start
git bisect bad
git bisect good known_good_commit
```

Then test each checked-out version and mark it:

```bash
git bisect good
# or
git bisect bad
```

When done:

```bash
git bisect reset
```

---

# 21. Ignoring and Untracking Files

Use these when files should not be tracked by Git.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Add ignored patterns | Edit `.gitignore` | 🟡 | Prevents future tracking. |
| Stop tracking file but keep locally | `git rm --cached file.txt` | 🟠 | File remains on disk. |
| Stop tracking folder but keep locally | `git rm -r --cached folder/` | 🟠 | Folder remains on disk. |
| Check why file is ignored | `git check-ignore -v file.txt` | 🟢 | Shows matching ignore rule. |
| Show ignored files | `git status --ignored` | 🟢 | Useful for debugging. |

## Recipe: “I accidentally committed `.env`”

```bash
echo ".env" >> .gitignore
git rm --cached .env
git add .gitignore
git commit -m "Stop tracking env file"
```

---

# 22. Handling Secrets and Sensitive Files

Use this when passwords, API keys, tokens, private keys, or `.env` files were committed.

> [!CAUTION]
> If a secret was pushed to a remote repository, consider it compromised. Rotate it immediately.

| Situation | Command / Action | Danger | Notes |
|---|---|---:|---|
| Remove secret from latest commit | `git rm --cached .env && git commit --amend` | 🟣 | Rewrites latest commit. |
| Remove secret in new commit | `git rm --cached .env && git commit -m "Remove env file"` | 🟡 | Safer for shared branches. |
| Search history for secret file | `git log -- .env` | 🟢 | Shows if file existed before. |
| Remove from full history | Use `git filter-repo` or BFG Repo-Cleaner | 🔴 🟣 | Coordinate with team. |
| Protect future commits | Add to `.gitignore` | 🟡 | Does not remove past exposure. |
| Actual security fix | Rotate the exposed key/password | 🟢 | Required if secret was pushed. |

## Recipe: “I committed a secret but did not push it”

```bash
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit --amend
```

## Recipe: “I pushed a secret”

1. Rotate the key/password immediately.
2. Remove the file from the repository.
3. Consider rewriting history with `git filter-repo` or BFG.
4. Tell collaborators to re-clone or carefully resync if history was rewritten.

---

# 23. Tags and Releases

Use tags for versions like `v1.0.0`.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Create lightweight tag | `git tag v1.0.0` | 🟡 | Simple pointer. |
| Create annotated tag | `git tag -a v1.0.0 -m "Version 1.0.0"` | 🟡 | Better for releases. |
| List tags | `git tag` | 🟢 | Shows local tags. |
| Push one tag | `git push origin v1.0.0` | 🟡 | Sends tag to remote. |
| Push all tags | `git push --tags` | 🟠 | Can push old/local tags too. |
| Delete local tag | `git tag -d v1.0.0` | 🔴 | Deletes local tag. |
| Delete remote tag | `git push origin --delete v1.0.0` | 🔴 | Deletes remote tag. |

## Recipe: “I want to create a release tag”

```bash
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

---

# 24. Repository Cleanup

Use these to clean local branches, stale remote references, and generated files.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Preview untracked cleanup | `git clean -fdn` | 🟢 | Always preview first. |
| Remove untracked files/folders | `git clean -fd` | 🔴 | Deletes untracked files. |
| Prune deleted remote branches | `git fetch --prune` | 🟡 | Updates remote-tracking refs. |
| See merged branches | `git branch --merged` | 🟢 | Helps find safe deletions. |
| Delete merged branch | `git branch -d branch-name` | 🟡 | Refuses if unmerged. |
| Run garbage collection | `git gc` | 🟡 | Usually not needed manually. |

## Recipe: “Clean stale remote branches”

```bash
git fetch --prune
```

---

# 25. Starting a Repository

Use these when starting from scratch or connecting to a remote.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Initialize repository | `git init` | 🟡 | Creates `.git`. |
| Clone repository | `git clone URL` | 🟡 | Downloads existing repo. |
| Add all files | `git add .` | 🟡 | Check before committing. |
| First commit | `git commit -m "Initial commit"` | 🟡 | Creates initial history. |
| Add remote | `git remote add origin URL` | 🟡 | Connects local repo to remote. |
| Rename branch to main | `git branch -M main` | 🟡 | Common default branch name. |
| Push first branch | `git push -u origin main` | 🟡 | Sets upstream. |

## Recipe: “Start local project and push to GitHub”

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin URL
git push -u origin main
```

---

# 26. Working with File History

Use these when you want to understand how a file changed over time.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Show commits that touched a file | `git log -- file.txt` | 🟢 | File-specific history. |
| Show file history with patches | `git log -p -- file.txt` | 🟢 | Detailed changes. |
| Show old version of file | `git show commit_hash:file.txt` | 🟢 | Prints file content. |
| Compare file between commits | `git diff commit1 commit2 -- file.txt` | 🟢 | Focused diff. |
| Find when text was added/removed | `git log -S "text" -- file.txt` | 🟢 | Very useful for debugging. |

## Recipe: “When was this function changed?”

```bash
git log -S "functionName" -- path/to/file
```

---

# 27. Detached HEAD Situations

Detached HEAD means you are looking at a commit directly instead of being on a branch.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Check current state | `git status` | 🟢 | Tells if HEAD is detached. |
| Return to a branch | `git switch main` | 🟡 | Leaves detached commit. |
| Save detached work to branch | `git switch -c new-branch` | 🟡 | Do this before losing work. |
| Inspect old commit | `git checkout commit_hash` | 🟡 | Common cause of detached HEAD. |

## Recipe: “I made commits in detached HEAD”

```bash
git switch -c saved-detached-work
```

**Use when:** You committed while detached and want to keep the work.

---

# 28. Useful Configuration

These are not daily commands, but they improve Git usage.

| Situation | Command | Danger | Notes |
|---|---|---:|---|
| Set global username | `git config --global user.name "Your Name"` | 🟡 | Used in commits. |
| Set global email | `git config --global user.email "you@example.com"` | 🟡 | Used in commits. |
| Set default branch name | `git config --global init.defaultBranch main` | 🟡 | New repos use `main`. |
| Use VS Code as editor | `git config --global core.editor "code --wait"` | 🟡 | Helpful for commits/rebase. |
| Show config | `git config --list` | 🟢 | Inspect settings. |
| Set pull to rebase by default | `git config --global pull.rebase true` | 🟡 | Team preference dependent. |
| Enable helpful reuse of conflict resolutions | `git config --global rerere.enabled true` | 🟡 | Useful for repeated rebases. |

---

# 29. Helpful Aliases

Optional aliases can make frequent commands easier.

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.sw switch
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.lg "log --oneline --graph --decorate --all"
```

Then you can run:

```bash
git st
git lg
```

---

# 30. Command Decision Guide

## I have uncommitted changes

| Goal | Use |
|---|---|
| Keep changes for later | `git stash -u` |
| Commit changes | `git add . && git commit` |
| Throw away tracked changes | `git restore .` |
| Throw away tracked and untracked changes | `git reset --hard && git clean -fd` |

## I made a bad commit

| Situation | Use |
|---|---|
| Not pushed yet, want to edit it | `git commit --amend` |
| Not pushed yet, want to remove it but keep work | `git reset --soft HEAD~1` |
| Not pushed yet, want to delete it completely | `git reset --hard HEAD~1` |
| Already pushed to shared branch | `git revert commit_hash` |
| Already pushed but private branch | `git reset` + `git push --force-with-lease` |

## I am afraid I lost work

| Situation | Use |
|---|---|
| I reset accidentally | `git reflog` |
| I deleted a branch | `git reflog` then `git branch recovered commit_hash` |
| I committed in detached HEAD | `git switch -c saved-work` |
| I deleted a tracked file | `git restore file.txt` |

---

# 31. Common Mistakes and Safer Alternatives

| Mistake | Better Habit |
|---|---|
| Running `git reset --hard` without checking | Run `git status` and `git diff` first. |
| Running `git clean -fd` directly | Run `git clean -fdn` first. |
| Using `git push --force` | Use `git push --force-with-lease`. |
| Rebasing shared branches | Prefer merge or coordinate with team. |
| Committing `.env` | Add `.env` to `.gitignore` early. |
| Making huge commits | Use `git add -p` to split changes. |
| Ignoring `git status` | Use it before and after most operations. |

---

# 32. The Most Useful Git Commands to Memorize

```bash
git status
git diff
git add -p
git commit
git log --oneline --graph --decorate --all
git restore
git restore --staged
git reset --soft HEAD~1
git reset --hard
git clean -fdn
git stash -u
git reflog
git switch -c
git fetch
git pull --rebase
git push --force-with-lease
```

---

# 33. Design Ideas for a Static Website

This Markdown is structured so a static site can turn each section into cards.

Suggested UI elements:

- Filter by danger level: 🟢 🟡 🟠 🔴 🟣
- Filter by topic: recovery, branch, remote, commit, cleanup
- Search by situation: “I pushed wrong”, “lost file”, “undo commit”
- Copy button beside every command block
- Warning cards for destructive commands
- “Safer alternative” callout for risky recipes
- Beginner mode: hide advanced sections like rebase, reflog, bisect
- Panic mode: show only recovery commands

Suggested card fields:

```yaml
title: "I accidentally ran git add ."
category: "Staging"
danger: "Moderate"
commands:
  - "git restore --staged ."
notes:
  - "Keeps file changes."
  - "Only removes files from staging."
```

---

# 34. Final Safety Reminder

Git is powerful because it tracks history.  
When you are unsure:

```bash
git status
git diff
git log --oneline --graph --decorate -10
git reflog
```

And before destructive work:

```bash
git branch safety-backup
```

A five-second backup branch can save hours of recovery.
