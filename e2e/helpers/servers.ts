import { spawn, ChildProcess } from "child_process";
import { promisify } from "util";

const sleep = promisify(setTimeout);

export interface ServerProcess {
  process: ChildProcess;
  port?: number;
  stop: () => Promise<void>;
}

export async function startPythonServer(): Promise<ServerProcess> {
  const serverProcess = spawn(
    "uv",
    ["run", "fastapi", "dev", "./main.py", "--reload"],
    {
      cwd: process.cwd() + "/../server",
      stdio: "pipe",
      detached: false,
    },
  );

  let output = "";
  serverProcess.stdout?.on("data", (data) => {
    output += data.toString();
    console.log("[Server STDOUT]:", data.toString());
  });

  serverProcess.stderr?.on("data", (data) => {
    output += data.toString();
    console.log("[Server STDERR]:", data.toString());
  });

  const maxWait = 15000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (
      output.includes("Server started at") ||
      output.includes("Uvicorn running") ||
      output.includes("Application startup complete")
    ) {
      await sleep(500);
      console.log("Python server started successfully");
      return {
        process: serverProcess,
        stop: async () => {
          // Kill the process and its children
          if (!serverProcess.killed) {
            serverProcess.kill("SIGTERM");
            await sleep(500);
            if (!serverProcess.killed) {
              serverProcess.kill("SIGKILL");
            }
          }
          await sleep(500);
        },
      };
    }
    await sleep(100);
  }

  serverProcess.kill();
  console.log("Server output so far:", output);
  throw new Error("Python server failed to start within timeout");
}

export async function startClientServer(): Promise<ServerProcess> {
  // Spawn vite directly instead of through npm to have better process control
  const clientProcess = spawn("npx", ["vite"], {
    cwd: process.cwd() + "/../client",
    stdio: "pipe",
    detached: false,
  });

  let output = "";
  clientProcess.stdout?.on("data", (data) => {
    output += data.toString();
    console.log("[Client STDOUT]:", data.toString());
  });

  clientProcess.stderr?.on("data", (data) => {
    output += data.toString();
    console.log("[Client STDERR]:", data.toString());
  });

  const maxWait = 30000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (output.includes("Local:") || output.includes("ready in")) {
      await sleep(1000);

      // Extract port from output like "Local:   http://localhost:5173/"
      // Strip ANSI codes first, then match
      const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, "");
      const matches = Array.from(cleanOutput.matchAll(/localhost:(\d+)/g));
      console.log(
        "Found port matches:",
        matches.map((m) => m[1]),
      );
      const portMatch = matches.length > 0 ? matches[matches.length - 1] : null;
      const port = portMatch ? parseInt(portMatch[1]) : 5173;

      console.log(`Client server started successfully on port ${port}`);
      return {
        process: clientProcess,
        port,
        stop: async () => {
          // Kill the process and its children
          if (!clientProcess.killed) {
            // Try graceful shutdown first
            clientProcess.kill("SIGTERM");
            await sleep(1000);
            // Force kill if still running
            if (!clientProcess.killed) {
              clientProcess.kill("SIGKILL");
            }
          }
          await sleep(500);
        },
      };
    }
    await sleep(100);
  }

  clientProcess.kill();
  console.log("Client output so far:", output);
  throw new Error("Client server failed to start within timeout");
}
