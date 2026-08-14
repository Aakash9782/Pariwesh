const { execSync } = require("child_process");
const fs = require("fs");

fs.writeFileSync("push_log.txt", "Start\n");
try {
  fs.appendFileSync("push_log.txt", "1. Git add...\n");
  execSync("git add -A", { stdio: "pipe" });

  fs.appendFileSync("push_log.txt", "2. Git commit...\n");
  try {
    const commitOut = execSync(
      'git commit -m "feat: product variants workspace specs extensions, order checkout security blocks, and packing orders details display color updates"',
      { stdio: "pipe" },
    );
    fs.appendFileSync(
      "push_log.txt",
      "Commit success:\n" + commitOut.toString() + "\n",
    );
  } catch (ex) {
    fs.appendFileSync(
      "push_log.txt",
      "Commit skipped/no changes: " + ex.message + "\n",
    );
  }

  fs.appendFileSync("push_log.txt", "3. Git push to origin main...\n");
  const pushOut = execSync("git push origin main", { stdio: "pipe" });
  fs.appendFileSync(
    "push_log.txt",
    "Push completed:\n" + pushOut.toString() + "\n",
  );

  fs.appendFileSync("push_log.txt", "DONE SUCCESS\n");
} catch (e) {
  fs.appendFileSync(
    "push_log.txt",
    "Error occurred: " +
      e.message +
      "\nStdout: " +
      e.stdout +
      "\nStderr: " +
      e.stderr +
      "\n",
  );
}
