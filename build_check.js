import { execSync } from "child_process";
import fs from "fs";

try {
  console.log("Starting client build...");
  const output = execSync("npm run build", {
    cwd: "d:\\leher\\client",
    encoding: "utf-8",
  });
  fs.writeFileSync("d:\\leher\\build_output.txt", output);
  console.log("Build succeeded!");
  fs.writeFileSync("d:\\leher\\build_status.txt", "SUCCESS");
} catch (error) {
  console.error("Build failed:", error);
  fs.writeFileSync(
    "d:\\leher\\build_output.txt",
    (error.stdout || "") + "\n" + (error.stderr || "") + "\n" + error.message,
  );
  fs.writeFileSync("d:\\leher\\build_status.txt", "FAILED");
}
