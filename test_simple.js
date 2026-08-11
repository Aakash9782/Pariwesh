import fs from "fs";

const run = async () => {
  let log = "";
  const addLog = (msg) => {
    console.log(msg);
    log += msg + "\n";
  };

  try {
    addLog("Fetching localhost settings...");
    const res = await fetch("http://localhost:5001/api/v1/settings");
    addLog(`HTTP Status: ${res.status}`);
    const data = await res.json();
    addLog(`JSON Response: ${JSON.stringify(data, null, 2)}`);
    fs.writeFileSync("./db_result.txt", log);
    process.exit(0);
  } catch (err) {
    addLog(`Fetch Error: ${err.message}`);
    fs.writeFileSync("./db_result.txt", log);
    process.exit(0);
  }
};

run();
