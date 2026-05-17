import "dotenv/config";

import { createServer } from "http";

import next from "next";

import { createMessagingSocketServer } from "@/lib/socket/server";

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  createMessagingSocketServer(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? "development" : "production"
      }`,
    );
  });
});
