import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(
  __dirname,
  "../../client/src/pages/admin/Marketing.jsx",
);
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

console.log("Line 199 content:", lines[198]);
console.log("Line 200 content:", lines[199]);
console.log("Line 646 content:", lines[645]);
console.log("Line 647 content:", lines[646]);

if (
  lines[198].includes("grid grid-cols-1 lg:grid-cols-2 gap-8") &&
  lines[645].includes("</Card>") &&
  lines[647].includes("{/* Coupons Directory Manager */}")
) {
  // Modify line 199
  lines[198] = '      <div className="grid grid-cols-1 gap-8">';

  // Remove lines 200 to 646 (indexes 199 to 645)
  lines.splice(199, 447);

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  console.log("Successfully removed Festive Campaign Scheduling card!");
} else {
  console.error(
    "Safety guard checking failed! Lines did not match expected structure.",
  );
}
