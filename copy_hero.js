const fs = require("fs");
try {
  fs.copyFileSync("client/src/assets/hero.png", "client/public/hero.png");
  console.log("SUCCESS: Copied hero image!");
} catch (err) {
  console.error("ERROR:", err.message);
}
process.exit(0);
