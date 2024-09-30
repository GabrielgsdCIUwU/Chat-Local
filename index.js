import express from "express";
import path from "path"
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
//import session from "express-session"
//import passport from "passport"
//import FileStoreFactory from "session-file-store"

import webrouter from "./router/paginas.js";
import admin from "./router/admin.js";
import chat from "./router/chat.js";

//const FileStore = FileStoreFactory(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env")
dotenv.config({ path: envFilePath });

const app = express();

app.use(express.json());
app.disable("x-powered-by");

/* app.use(
    session({
        store: new FileStore({
            path: "./sessions",
            ttl: 86400,
        }),
        secret: process.env.sessionSecret,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());
*/
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server);


app.use("/public", express.static(path.join(__dirname, "public")));

app.use(webrouter);
app.use(admin);
app.use(chat);


io.on("connection", (socket) => {
    socket.on("sendmsg", (msg) => {
        io.emit("sendmsg", msg);
    });

    socket.on("disconnect", () => {});
});



server.listen(port, () => {
    console.log("Escuchando: " + port);
});