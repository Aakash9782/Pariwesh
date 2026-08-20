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

// Find index of Festive Campaign Scheduling or Campaign header removed
const headerIndex = lines.findIndex(
  (l) =>
    l.includes("Festive Campaign Scheduling") ||
    l.includes("Campaign header removed"),
);
if (headerIndex === -1) {
  console.error("Could not find campaign header line!");
  process.exit(1);
}

// Find nearest <Card> before headerIndex
let cardStartIndex = -1;
for (let i = headerIndex; i >= 0; i--) {
  if (lines[i].includes("<Card")) {
    cardStartIndex = i;
    break;
  }
}
if (cardStartIndex === -1) {
  console.error("Could not find <Card> start line!");
  process.exit(1);
}

// Find corresponding closing </Card>
let cardEndIndex = -1;
let cardCount = 0;
for (let i = cardStartIndex; i < lines.length; i++) {
  if (lines[i].includes("<Card")) {
    cardCount++;
  }
  if (lines[i].includes("</Card>")) {
    cardCount--;
    if (cardCount === 0) {
      cardEndIndex = i;
      break;
    }
  }
}

if (cardEndIndex === -1) {
  console.error("Could not find closing </Card>!");
  process.exit(1);
}

console.log(
  `Matched Card Start: ${cardStartIndex + 1}: ${lines[cardStartIndex].trim()}`,
);
console.log(
  `Matched Card End  : ${cardEndIndex + 1}: ${lines[cardEndIndex].trim()}`,
);

// Delete the card lines
lines.splice(cardStartIndex, cardEndIndex - cardStartIndex + 1);

fs.writeFileSync(filePath, lines.join("\n"), "utf8");
console.log("Successfully removed Festive Campaign Scheduling card!");
