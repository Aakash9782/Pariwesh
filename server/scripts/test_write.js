import fs from "fs";
import path from "path";

console.log("HELLO FROM NODE SCRIPT");
fs.writeFileSync(path.resolve("test_output.txt"), "NODE EXECUTION SUCCESS");
console.log("WRITE COMPLETED");
process.exit(0);
