const childProcess = require("child_process");

async function execute (command) {
  return new Promise((resolve, reject) => {
    const process = childProcess.exec(command)
    process.stdout.on("data", resolve)
    process.on("error", reject);
    process.on("exit", reject);
  })
}

async function getTotalExternalDisplays () {
  const data = await execute("system_profiler SPDisplaysDataType -json");
  const info = JSON.parse(data);
  const displays = info.SPDisplaysDataType[0].spdisplays_ndrvs;
  // I think apple marks the default macbook display with id=1
  const externalDisplays = displays.filter(d => d._spdisplays_displayID !== "1")
  return externalDisplays.length;
}

async function enableSleep (enable) {
  return execute(`sudo pmset -a disablesleep ${enable ? 0 : 1}`).catch(console.error)
}

async function isSleepDisabled () {
  const data = await execute("pmset -g");
  const [sleepDisabledLine] = data.split("\n").filter(line => /SleepDisabled/g.test(line))
  return sleepDisabledLine ? /1/.test(sleepDisabledLine) : null;
}

(async function () {
  const [total, isDisabled] = await Promise.all([
    getTotalExternalDisplays(),
    isSleepDisabled()
  ]);
  console.log("Total external displays: ", total);
  if (total > 0 && !isDisabled) {
    console.log("Sleep is enabled, disabling...")
    await enableSleep(false);
  }
  else if (total === 0 && isDisabled) {
    console.log("Sleep is disabled, enabling...")
    await enableSleep(true);
  }
})()
