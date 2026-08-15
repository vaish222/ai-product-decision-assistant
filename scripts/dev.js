import { spawn } from "child_process";

const children = [];
let stopping = false;

function start(command, args, env = process.env) {
  const child = spawn(command, args, { env, stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => {
    if (!stopping && code !== 0) stop(code || 1);
  });
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 50);
}

start(process.execPath, ["server/index.js", "--api-only"], { ...process.env, API_PORT: "3001" });
start(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"]);

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
