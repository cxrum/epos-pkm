const { spawn } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const binDir = path.join(projectRoot, "node_modules", ".bin");
const isWindows = process.platform === "win32";

const waitOnBin = path.join(binDir, isWindows ? "wait-on.cmd" : "wait-on");
const electronBin = path.join(binDir, isWindows ? "electron.cmd" : "electron");

const env = {
  ...process.env,
  APP_IS_NIGHTLY: "yes",
  APP_IS_DEV: "yes",
};

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} terminated with signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }

      resolve();
    });
  });

async function main() {
  await run("yarn", ["build"], { shell: isWindows });
  await run(waitOnBin, ["tcp:3000"], { shell: isWindows });
  await run(electronBin, ["."], { shell: isWindows });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
