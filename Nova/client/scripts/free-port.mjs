import { execSync } from "node:child_process";

const port = Number(process.argv[2] || 5173);

if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid port: ${process.argv[2]}`);
  process.exit(1);
}

function getPidsWindows(targetPort) {
  // Prefer PowerShell TCP query because netstat formatting can vary.
  try {
    const psOutput = execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${targetPort} -State Listen | Select-Object -ExpandProperty OwningProcess"`,
      {
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      }
    );

    const psPids = psOutput
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
      .map(Number);

    if (psPids.length > 0) {
      return [...new Set(psPids)];
    }
  } catch {
    // Fall through to netstat parsing.
  }

  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${targetPort}`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });

    const pids = new Set();

    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes("LISTENING")) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(Number(pid));
    }

    return [...pids];
  } catch {
    return [];
  }
}

function getPidsUnix(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort}`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });

    return output
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
      .map(Number);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, {
        stdio: ["ignore", "ignore", "ignore"],
      });
    } else {
      process.kill(pid, "SIGKILL");
    }
    return true;
  } catch {
    return false;
  }
}

const pids = process.platform === "win32" ? getPidsWindows(port) : getPidsUnix(port);

if (pids.length === 0) {
  process.exit(0);
}

let killedCount = 0;
for (const pid of pids) {
  if (killPid(pid)) killedCount += 1;
}

if (killedCount > 0) {
  console.log(`Freed port ${port} by stopping ${killedCount} process(es).`);
}
