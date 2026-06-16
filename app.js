import express from "express";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import session from "express-session";
import passport from "passport";
import FileStoreFactory from "session-file-store";

import webrouter from "./backend/api/router/paginas.js";
import admin from "./backend/api/router/admin.js";
import chat from "./backend/api/router/chat.js";
import img from "./backend/api/router/img.js";
import perfil from "./backend/api/router/perfil.js";

const FileStore = FileStoreFactory(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.disable("x-powered-by");

const USE_HTTPS = process.env.USE_HTTPS === "true";

/**
 * Configured session middleware. Exported to be reused by Socket.io.
 * @type {import('express').RequestHandler}
 */
export const sessionMiddleware = session({
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

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/resources", express.static(path.join(__dirname, "resources")));

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(webrouter);
app.use(admin);
app.use(chat);
app.use("/img", img);
app.use("/perfil", perfil);

export { app, __dirname };