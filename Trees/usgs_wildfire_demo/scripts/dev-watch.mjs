#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";

const children = [];
let shuttingDown = false;

function start(command, args, name) {
  const child = spawn(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (signal || code !== 0) {
      shuttingDown = true;
      stopAll();
      process.exit(code ?? 1);
    }
  });

  children.push(child);
  return child;
}

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  shuttingDown = true;
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  stopAll();
  process.exit(0);
});

start("npm", ["run", "sync:watch"], "sync");
start("npm", ["run", "dev"], "dev");
