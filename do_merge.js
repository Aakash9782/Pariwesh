const { execSync } = require("child_process");
const fs = require("fs");

fs.writeFileSync("merge_log.txt", "Start\n");
try {
  fs.appendFileSync("merge_log.txt", "1. Git add...\n");
  execSync("git add -A", { stdio: "pipe" });

  fs.appendFileSync("merge_log.txt", "2. Git commit...\n");
  try {
    execSync(
      'git commit -m "fix: final product variant spec wizard corrections and details display color updates"',
      { stdio: "pipe" },
    );
  } catch (ex) {
    fs.appendFileSync(
      "merge_log.txt",
      "Commit skipped/no changes: " + ex.message + "\n",
    );
  }

  fs.appendFileSync("merge_log.txt", "3. Git checkout main...\n");
  execSync("git checkout main", { stdio: "pipe" });

  fs.appendFileSync("merge_log.txt", "4. Git merge branch...\n");
  const mergeOut = execSync("git merge listing-form-update", {
    stdio: "pipe",
  });
  fs.appendFileSync(
    "merge_log.txt",
    "Merge completed:\n" + mergeOut.toString() + "\n",
  );

  fs.appendFileSync("merge_log.txt", "DONE SUCCESS\n");
} catch (e) {
  fs.appendFileSync(
    "merge_log.txt",
    "Error occurred: " +
      e.message +
      "\nStdout: " +
      e.stdout +
      "\nStderr: " +
      e.stderr +
      "\n",
  );
}
