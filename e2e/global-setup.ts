import { chromium, FullConfig } from "@playwright/test";
import {
  startPythonServer,
  startClientServer,
  ServerProcess,
} from "./helpers/servers";

let pythonServer: ServerProcess;
let clientServer: ServerProcess;

export default async function globalSetup(config: FullConfig) {
  console.log("Starting servers for all tests...");

  pythonServer = await startPythonServer();
  clientServer = await startClientServer();

  const baseURL = `http://localhost:${clientServer.port || 5173}`;
  console.log(`Servers ready. Client at: ${baseURL}`);

  // Store the base URL in environment for tests to use
  process.env.E2E_BASE_URL = baseURL;

  // Return teardown function
  return async () => {
    console.log("Stopping servers...");
    if (clientServer) await clientServer.stop();
    if (pythonServer) await pythonServer.stop();

    console.log(
      "Running final cleanup (killing vite and fastapi processes)...",
    );
    // Extra cleanup: kill any lingering processes using child_process.execSync
    const { execSync } = await import("child_process");
    try {
      execSync(
        "pkill -9 -f 'vite' 2>/dev/null || true; pkill -9 -f 'fastapi dev' 2>/dev/null || true",
        {
          stdio: "ignore",
          shell: "/bin/bash",
        },
      );
      // Give processes time to die
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      // Ignore cleanup errors - processes may already be dead
    }
    console.log("Cleanup complete");
  };
}
