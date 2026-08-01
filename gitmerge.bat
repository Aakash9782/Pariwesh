@echo off
echo === Starting Merge Operation === > merge_log.txt
echo [1/4] Adding files... >> merge_log.txt
git add . >> merge_log.txt 2>&1
echo [2/4] Committing changes... >> merge_log.txt
git commit -m "feat: Implement admin skeleton loaders and fix alert type/timeout issues" >> merge_log.txt 2>&1
echo [3/4] Checking out main branch... >> merge_log.txt
git checkout main >> merge_log.txt 2>&1
echo [4/4] Merging 25_july into main... >> merge_log.txt
git merge 25_july --no-edit >> merge_log.txt 2>&1
echo === Merge Operation Complete === >> merge_log.txt
