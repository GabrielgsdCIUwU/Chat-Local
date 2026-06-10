import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import https from "https"
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import passport from "passport";
import FileStoreFactory from "session-file-store";
import fs from "fs";

import webrouter from "./router/paginas.js";
import admin from "./router/admin.js";
import chat from "./router/chat.js";
import img from "./router/img.js"
import perfil from "./router/perfil.js";
import privateRouter from "./router/private.js";
import setupSockets from "./socket/socketHandler.js";


const FileStore = FileStoreFactory(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });


const app = express();

app.use(express.json());
app.disable("x-powered-by");

const USE_HTTPS = process.env.USE_HTTPS === "true";

const sessionMiddleware = session({
    store: new FileStore({
        path: "./sessions",
        ttl: 86400,
    }),
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: USE_HTTPS,
        sameSite: USE_HTTPS ? "lax" : "strict",
        maxAge: 1000 * 60 * 60 * 24
    }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

let server;
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

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
        console.log(`Redireccionando`);
    });
} else {
    server = http.createServer(app);
}

const io = new SocketIOServer(server);
setupSockets(io, sessionMiddleware);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/resources", express.static(path.join(__dirname, "resources")));

app.use(webrouter);
app.use(admin);
app.use(chat);
app.use("/img", img);
app.use("/perfil", perfil);
app.use("/private", privateRouter(io));

const ACTIVE_PORT = USE_HTTPS ? HTTPS_PORT : HTTP_PORT;
server.listen(ACTIVE_PORT, () => {
    console.log(`Escuchando: ${ACTIVE_PORT}`);
})