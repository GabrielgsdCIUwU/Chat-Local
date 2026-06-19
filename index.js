import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Server as SocketIOServer } from "socket.io";

import { app, sessionMiddleware, __dirname } from "./app.js";
import privateRouter from "./backend/api/router/private.js";
import setupSockets from "./socket/socketHandler.js";
import { container } from "./backend/core/DIContainer.js";

const USE_HTTPS = process.env.USE_HTTPS === "true";
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

let server;

if (USE_HTTPS) {
    const sslOptions = {
        key: fs.readFileSync(path.join(__dirname, "./certificates/key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "./certificates/cert.pem")),
    };

    server = https.createServer(sslOptions, app);

    http.createServer((req, res) => {
        const host = req.headers.host.split(':')[0];
        res.writeHead(301, {
            Location: `https://${host}:${HTTPS_PORT}${req.url}`
        });
        res.end();
    }).listen(HTTP_PORT, () => {
        console.log(`HTTP Server redirecting to HTTPS on port ${HTTP_PORT}`);
    });
} else {
    server = http.createServer(app);
}

const io = new SocketIOServer(server);
setupSockets(io, sessionMiddleware);

app.use("/private", privateRouter(io));

const ACTIVE_PORT = USE_HTTPS ? HTTPS_PORT : HTTP_PORT;

server.listen(ACTIVE_PORT, () => {
    console.log(`Servidor escuchando en el puerto: ${ACTIVE_PORT}`);

    container.cronManager.startAll(io);
});