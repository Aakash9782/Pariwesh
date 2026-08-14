@echo off
echo 1. Staging all workspace changes...
git add -A

echo 2. Committing remaining changes...
git commit -m "fix: final product variant spec wizard corrections and details display color updates"

echo 3. Switching to main branch...
git checkout main

echo 4. Merging listing-form-update into main...
git merge listing-form-update

echo 5. Active Branch Status:
git branch

echo DONE SUCCESS
