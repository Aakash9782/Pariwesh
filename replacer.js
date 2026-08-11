const fs = require("fs");
const file = "d:/leher/client/src/pages/Home.jsx";
let text = fs.readFileSync(file, "utf8");
const searchStr = "{/* Dynamic Festive Offer Banner Row */}";
const start = text.indexOf(searchStr);
if (start === -1) {
  console.error("Could not find search string");
  process.exit(1);
}
const end = text.indexOf("})()", start) + 4;
if (end === -1) {
  console.error("Could not find end bracket");
  process.exit(1);
}

const replacement = `      {/* Premium Dynamic / Static Secondary Banner Slider */}
      <PremiumBannerSlider
        adConfig={adConfig}
        handleCopyCode={handleCopyCode}
        copiedCode={copiedCode}
      />`;

const newText = text.substring(0, start) + replacement + text.substring(end);
fs.writeFileSync(file, newText, "utf8");
console.log("Replacer success");
