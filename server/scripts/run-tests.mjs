import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tests");
const files = (await readdir(testsDir))
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => path.join(testsDir, name));

if (files.length === 0) {
  console.error(`No *.test.js files found in ${testsDir}`);
  process.exit(1);
}

const child = spawn(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
