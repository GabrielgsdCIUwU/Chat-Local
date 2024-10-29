import express, { json } from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
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



const FileStore = FileStoreFactory(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });


const app = express();

app.use(express.json());
app.disable("x-powered-by");

const sessionMiddleware = session({
    store: new FileStore({
        path: "./sessions",
        ttl: 432000,
    }),
    secret: process.env.sessionSecret,
    resave: false,  
    saveUninitialized: false,
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/resources", express.static(path.join(__dirname, "resources")));

app.use(webrouter);
app.use(admin);
app.use(chat);
app.use("/img", img)

function isAuthenticated(socket, next) {
    if (socket.request.session && socket.request.session.user) {
        next();
    } else {
        next(new Error("Usuario no autenticado"));
    }
}

// Aplica el middleware de sesión a los sockets
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, (err) => {
        if (err) return next(err);
        next();
    });
});
const connectedUsers = new Set();
function getUserNames() {
    return new Promise((resolve) => {
        const userNames = Array.from(connectedUsers);
        resolve(userNames);
    });
}

io.on("connection", (socket) => {
    isAuthenticated(socket, (err) => {
        if (err) {
            socket.disconnect();
            return;
        }

        const user = socket.request.session.user;
        connectedUsers.add(user.name)
        getUserNames().then(userNames => {
            socket.emit("userNames", userNames);
        });

        socket.emit("currentUser", user.name);

        socket.on("sendmsg", (msg) => {
            const timestamp = new Date().getTime();
            const messagesFilePath = path.join(__dirname, "./public/json/messages.json");

            fs.readFile(messagesFilePath, "utf-8", (err, data) => {
                if (err) {
                    console.error("Error al leer el archivo de mensajes:", err);
                    return socket.emit("error", { message: "Error al leer los mensajes" });
                }

                let messagesData = [];
                try {
                    messagesData = JSON.parse(data);
                } catch (error) {
                    console.error("Error al parsear los mensajes:", error);
                    return socket.emit("error", { message: "Error al parsear los mensajes" });
                }

                const newMessage = { name: user.name, message: msg, timestamp };
                messagesData.push(newMessage);

                fs.writeFile(messagesFilePath, JSON.stringify(messagesData, null, 2), "utf-8", (err) => {
                    if (err) {
                        console.error("Error al escribir el mensaje en el archivo:", err);
                        return socket.emit("error", { message: "Error al escribir el mensaje" });
                    }

                    io.emit("sendmsg", { user: user.name, message: msg, timestamp: timestamp });
                });
            });
        });

        socket.on("requestHistory", () => {
            const messagesFilePath = path.join(__dirname, "./public/json/messages.json");
            fs.readFile(messagesFilePath, "utf-8", (err, data) => {
                if (err) {
                    console.error("Error al leer el archivo de mensajes:", err);
                    return socket.emit("error", { message: "Error al leer los mensajes" });
                }

                let messagesData = [];
                try {
                    messagesData = JSON.parse(data);
                } catch (error) {
                    console.error("Error al parsear los mensajes:", error);
                    return socket.emit("error", { message: "Error al parsear los mensajes" });
                }

                socket.emit("messageHistory", messagesData);
            });
        });

        socket.on("emojisNames", () => {
            const emojisNames = new Set();
            const imgDir = path.join(__dirname, "./resources/emojis");

            const files = fs.readdirSync(imgDir);
            files.forEach((file) => {
                emojisNames.add(path.parse(file).name)
            });
            socket.emit("emojisNames", emojisNames);
        });


        socket.on("disconnect", () => {
            connectedUsers.delete(user.name)
            getUserNames().then(userNames => {
                io.emit("userNames", userNames);
            });
        });

        app.get("/private/reload", (req, res) => {
            if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
                io.emit("reload");
                res.sendFile(path.join(__dirname, "./public/views/reload.html"))
            }
        });
        app.get("/private/testing", (req, res) => {
            if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
                res.sendFile(path.join(__dirname, "./public/views/testing.html"))
            }
        });
        app.get("/private/md", (req, res) => {
            if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
                res.sendFile(path.join(__dirname, "./public/views/testing-md.html"))
            }
        });
        app.get("/login", (req, res) => {
            res.redirect("/msg")
        });
        
        socket.on("sendPrivateMsg", ({recipient, message}) => {
            const timestamp = new Date().getTime();

            const recipientSocket = Array.from(io.sockets.sockets.values()).find(
                (s) => s.request.session.user && s.request.session.user.name === recipient
            );

            if(recipientSocket) {
                recipientSocket.emit("privateMessage", {
                    sender: user.name,
                    message,
                    timestamp,
                });

                socket.emit("privateMessage", {
                    sender: user.name,
                    message,
                    timestamp,
                });
            } else {
                socket.emit("error", { message: `Usuario ${recipient} no está conectado.`})
            }
        });
    });
});


server.listen(port, () => {
    console.log("Escuchando: " + port);
});
