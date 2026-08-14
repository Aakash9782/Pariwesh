const { execSync } = require("child_process");
const fs = require("fs");

let log = "";
const logWrite = (msg) => {
  log += msg + "\n";
  fs.writeFileSync("merge_log.txt", log);
};

try {
  logWrite("1. Switching to listing-form-update branch...");
  execSync("git checkout listing-form-update", { encoding: "utf8" });

  logWrite("2. Staging all modified files...");
  execSync("git add -A", { encoding: "utf8" });

  logWrite("3. Committing remaining changes...");
  try {
    const commitOut = execSync(
      'git commit -m "fix: final product variant spec wizard corrections and details display color updates"',
      { encoding: "utf8" },
    );
    logWrite("Commit Output: " + commitOut);
  } catch (err) {
    logWrite("Commit skipped or already clean: " + err.message);
  }

  logWrite("4. Checking out main branch...");
  const checkoutMainOut = execSync("git checkout main", { encoding: "utf8" });
  logWrite("Checkout main output: " + checkoutMainOut);

  logWrite("5. Merging listing-form-update into main...");
  const mergeOut = execSync("git merge listing-form-update", {
    encoding: "utf8",
  });
  logWrite("Merge Output: " + mergeOut);

  logWrite("6. Confirming active branch...");
  const branchOut = execSync("git branch", { encoding: "utf8" });
  logWrite("Active branch listing:\n" + branchOut);

  logWrite("DONE SUCCESS");
} catch (err) {
  logWrite("ERROR OCCURRED: " + err.message);
  if (err.stdout) logWrite("Stdout: " + err.stdout);
  if (err.stderr) logWrite("Stderr: " + err.stderr);
}
