import dotenv from "dotenv";
import ngrok from "@ngrok/ngrok";
import http from "node:http";
import httpProxy from "http-proxy";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is not defined`);
  }

  return value;
}

function getPort(name: string): number {
  const value = getEnv(name);
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${name} must be a valid port`);
  }

  return port;
}

async function main() {
  const domain = getEnv("NGROK_DOMAIN");

  const tunnelPort = getPort("TUNNEL_PORT");
  const webPort = getPort("WEB_PORT");
  const apiPort = getPort("API_PORT");
  const mlPort = getPort("ML_PORT");

  const proxy = httpProxy.createProxyServer();

  const server = http.createServer((req, res) => {
    const url = req.url ?? "/";

    let target: string;

    if (url.startsWith("/api")) {
      target = `http://localhost:${apiPort}`;
    } else if (url.startsWith("/ml")) {
      target = `http://localhost:${mlPort}`;
    } else {
      target = `http://localhost:${webPort}`;
    }

    proxy.web(req, res, {
      target,
      changeOrigin: true,
    });
  });

  proxy.on("error", (error, _req, res) => {
    console.error("Proxy error:", error.message);

    if (!res.headersSent) {
      res.writeHead(502, {
        "Content-Type": "application/json",
      });
    }

    res.end(
      JSON.stringify({
        error: "Bad Gateway",
        message: error.message,
      }),
    );
  });

  await new Promise<void>((resolve) => {
    server.listen(tunnelPort, "localhost", () => {
      resolve();
    });
  });

  console.log(`🔀 Proxy: http://localhost:${tunnelPort}`);
  console.log(`🌐 Web:     http://localhost:${webPort}`);
  console.log(`🔌 API:     http://localhost:${apiPort}`);
  console.log(`🤖 ML:      http://localhost:${mlPort}`);

  const forwarder = await ngrok.forward({
    addr: tunnelPort,
    domain,
    authtoken_from_env: true,
  });

  console.log(`🌍 Public: ${forwarder.url()}`);

  const shutdown = async () => {
    await ngrok.disconnect();

    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

await main();
